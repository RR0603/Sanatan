"""Test package.

Sources are deliberately exercised in their failure modes, which logs
warnings. Those are expected, so the log is quietened to keep CI output
readable; a genuine test failure still reports in full.
"""

import logging

logging.disable(logging.WARNING)
