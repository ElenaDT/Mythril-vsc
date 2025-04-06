# GitHub Versioning Guide

We use [Semantic Versioning 2.0.0](https://semver.org/) for development tracking.

## Development Versions (0.x.x)

During initial development, versions will start with 0.x.x:

- `0.1.0` - First working prototype
- `0.2.0` - Significant feature additions
- `0.3.0` - Major improvements
- etc.

## Stable Version (1.0.0)

Version 1.0.0 will be tagged when:

- The codebase is stable
- Core features are complete
- The project is production-ready
- Breaking changes are unlikely

## Version Format

```md
MAJOR.MINOR.PATCH
```

Example: `0.2.1`

### What Each Number Means

1. **MAJOR** version (0.x.x during development, 1.x.x when stable)
   - Major architectural changes
   - Breaking changes

2. **MINOR** version (x.2.x)
   - New features
   - Substantial improvements

3. **PATCH** version (x.x.3)
   - Bug fixes
   - Minor improvements

## GitHub Tags

We use GitHub tags to mark significant versions:

```bash
git tag -a v0.1.0 -m "First working prototype"
git push origin v0.1.0
```

## Development Stages

1. **Initial Development (0.x.x)**
   - Rapid changes
   - Experimental features
   - API may change frequently

2. **Stable Release (1.0.0)**
   - Production ready
   - Stable API
   - Documented features
