@echo off
echo ========================================================
echo   Uploading Clean Cricket Scorer App to GitHub...
echo ========================================================

cd /d "%~dp0"

echo 1. Removing large cached files (Antigravity IDE)...
rd /s /q .git 2>nul
git init

echo 2. Configuring Git User Identity...
git config user.name "krupeshpatel1925-cmd"
git config user.email "krupeshpatel@example.com"

echo 3. Connecting to your GitHub Repository...
git remote add origin https://github.com/krupeshpatel1925-cmd/cric-scorer.git

echo 4. Adding Clean Source Code (Ignoring heavy binaries)...
git add .

echo 5. Committing Clean Project...
git commit -m "Cricket Scorer Pro App Complete"

echo 6. Setting Branch to main...
git branch -M main

echo 7. Pushing to GitHub...
git push -u origin main --force

echo.
echo ========================================================
echo   SUCCESS! Check your repository:
echo   https://github.com/krupeshpatel1925-cmd/cric-scorer
echo ========================================================
pause
