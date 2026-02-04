# Git init template

Contents of this directory are meant for use with:

```bash
git init --template=/path/to/slatestack/git-template
```

when creating a new repository. Git will copy `description`, `info/exclude`, and any `hooks` into the new `.git` directory. This repo only provides `description` and `info/exclude`; add hook samples under `hooks/` if needed.
