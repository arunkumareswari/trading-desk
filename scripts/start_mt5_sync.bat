@echo off
title MT5 Trading Journal Direct Sync Bridge
cd /d "%~dp0"
echo ====================================================
echo Starting MT5 Trading Journal Python Bridge...
echo ====================================================
echo Webhook URL: Edit mt5_sync.py to set your server URL
echo Account Token: Copy from Journal Settings - MT5 Sync tab
echo ====================================================
echo.
python mt5_sync.py
echo.
echo Bridge stopped. Press any key to exit.
pause
