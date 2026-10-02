"""Content-addressed blob store.

Every distinct byte-sequence Rewind has ever seen is stored exactly once, keyed
by the SHA-256 of its *uncompressed* contents. Frames therefore cost only their
manifest: a thousand frames of a tree where one file changed store one extra
blob, not a thousand copies of the tree.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import zlib
from pathlib import Path
from typing import Iterator

CHUNK = 1024 * 256


class BlobStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.tmp = self.root / "tmp"

    def ensure(self) -> None:
        self.tmp.mkdir(parents=True, exist_ok=True)

    def path_for(self, digest: str) -> Path:
        return self.root / digest[:2] / digest[2:]

    def has(self, digest: str) -> bool:
        return self.path_for(digest).exists()

    def _finalize(self, temp: Path, digest: str) -> None:
        dest = self.path_for(digest)
        if dest.exists():
            # Someone already stored these bytes; ours are redundant by definition.
            temp.unlink(missing_ok=True)
            return
        dest.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temp, dest)

    def put_path(self, src: Path) -> tuple[str, int]:
        """Hash and store a file in a single pass. Returns (digest, size)."""
        self.ensure()
        hasher = hashlib.sha256()
        size = 0
        compressor = zlib.compressobj(6)
        fd, tmp_name = _mkstemp(self.tmp)
        temp = Path(tmp_name)
        try:
            with os.fdopen(fd, "wb") as out, open(src, "rb") as fh:
                while True:
                    chunk = fh.read(CHUNK)
                    if not chunk:
                        break
                    hasher.update(chunk)
                    size += len(chunk)
                    out.write(compressor.compress(chunk))
                out.write(compressor.flush())
            digest = hasher.hexdigest()
            self._finalize(temp, digest)
            return digest, size
        except BaseException:
            temp.unlink(missing_ok=True)
            raise

    def put_bytes(self, data: bytes) -> tuple[str, int]:
        self.ensure()
        digest = hashlib.sha256(data).hexdigest()
        if not self.has(digest):
            fd, tmp_name = _mkstemp(self.tmp)
            temp = Path(tmp_name)
            try:
                with os.fdopen(fd, "wb") as out:
                    out.write(zlib.compress(data, 6))
                self._finalize(temp, digest)
            except BaseException:
                temp.unlink(missing_ok=True)
                raise
        return digest, len(data)

    def read(self, digest: str) -> bytes:
        return zlib.decompress(self.path_for(digest).read_bytes())

    def extract(self, digest: str, dest: Path, mode: int | None = None,
                mtime: float | None = None) -> None:
        """Materialize a blob at ``dest``, replacing whatever is there."""
        src = self.path_for(digest)
        if not src.exists():
            raise KeyError(f"blob {digest[:12]} is missing from the store")
        dest.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_name = _mkstemp(dest.parent, prefix=".rewind-")
        temp = Path(tmp_name)
        try:
            decompressor = zlib.decompressobj()
            with os.fdopen(fd, "wb") as out, open(src, "rb") as fh:
                while True:
                    chunk = fh.read(CHUNK)
                    if not chunk:
                        break
                    out.write(decompressor.decompress(chunk))
                out.write(decompressor.flush())
            if mode is not None:
                os.chmod(temp, mode)
            if mtime is not None:
                os.utime(temp, (mtime, mtime))
            if dest.is_dir() and not dest.is_symlink():
                shutil.rmtree(dest)
            os.replace(temp, dest)
        except BaseException:
            temp.unlink(missing_ok=True)
            raise

    def iter_digests(self) -> Iterator[str]:
        if not self.root.exists():
            return
        for shard in sorted(self.root.iterdir()):
            if not shard.is_dir() or shard.name == "tmp" or len(shard.name) != 2:
                continue
            for blob in shard.iterdir():
                yield shard.name + blob.name

    def remove(self, digest: str) -> int:
        path = self.path_for(digest)
        try:
            size = path.stat().st_size
            path.unlink()
            return size
        except FileNotFoundError:
            return 0

    def disk_usage(self) -> int:
        total = 0
        for shard in self.root.glob("*/*"):
            try:
                total += shard.stat().st_size
            except OSError:
                pass
        return total


def _mkstemp(directory: Path, prefix: str = "blob-") -> tuple[int, str]:
    import tempfile

    directory.mkdir(parents=True, exist_ok=True)
    return tempfile.mkstemp(dir=str(directory), prefix=prefix)
