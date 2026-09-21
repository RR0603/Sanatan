"""Rewind - a time machine for your files.

Rewind records your working tree as a film: a sequence of *frames*, each one a
complete picture of the tree at a moment in time. A playhead points at the frame
you are living in. Move the playhead back and the files on disk are rewound to
match; move it forward and they play again.

Nothing is ever thrown away. Rewinding is itself recorded, so the reverse can
always be reversed.
"""

__version__ = "1.0.0"
__all__ = ["__version__"]
