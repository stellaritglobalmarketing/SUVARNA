@echo off
REM One-click push: commits every change in this folder and pushes it to GitHub (origin/main).
REM Secrets stay out: backend\.env, frontend\.env*, node_modules and uploads are in .gitignore.
setlocal
cd /d "%~dp0"

echo.
echo ===== Suvarna7 - push to GitHub =====
echo.
git status --short
echo.

git diff --quiet && git diff --cached --quiet && (
  for /f %%i in ('git ls-files --others --exclude-standard') do goto :changes
  echo Nothing to push - no changes.
  goto :end
)

:changes
set "MSG="
set /p MSG=Commit message (Enter for "Update site"):
if "%MSG%"=="" set "MSG=Update site"

git add -A || goto :fail
git commit -m "%MSG%" || goto :fail
git push origin main || goto :fail

echo.
echo Done - pushed to https://github.com/stellaritglobalmarketing/SUVARNA
goto :end

:fail
echo.
echo Push failed - read the message above. (Not logged in to GitHub? Run "git push" once in a terminal to sign in.)

:end
echo.
pause
