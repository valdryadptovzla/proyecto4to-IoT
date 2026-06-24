param(
  [string]$ApiHost
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
$venvConfig = Join-Path $projectRoot '.venv\pyvenv.cfg'

function Test-PythonCommand {
  param(
    [string]$Command,
    [string[]]$Arguments = @('--version')
  )

  try {
    $process = Start-Process -FilePath $Command -ArgumentList $Arguments -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\python-check.out" -RedirectStandardError "$env:TEMP\python-check.err"
    return $process.ExitCode -eq 0
  } catch {
    return $false
  }
}

function Get-VenvBasePython {
  if (-not (Test-Path $venvConfig)) {
    return $null
  }

  $executableLine = Get-Content $venvConfig | Where-Object { $_ -like 'executable = *' } | Select-Object -First 1
  if ($executableLine) {
    return $executableLine -replace '^executable = ', ''
  }

  $homeLine = Get-Content $venvConfig | Where-Object { $_ -like 'home = *' } | Select-Object -First 1
  if ($homeLine) {
    return (Join-Path ($homeLine -replace '^home = ', '') 'python.exe')
  }

  return $null
}

function Show-PythonHelpAndExit {
  $venvBasePython = Get-VenvBasePython

  if ($venvBasePython) {
    Write-Host "El entorno .venv esta roto: apunta a una instalacion que ya no existe:" -ForegroundColor Yellow
    Write-Host "  $venvBasePython" -ForegroundColor Yellow
  }

  Write-Host ""
  Write-Host "Solucion recomendada:" -ForegroundColor Cyan
  Write-Host "1. Cierra esta ventana de PowerShell si el entorno .venv esta activado."
  Write-Host "2. Instala Python 3.11+ desde https://www.python.org/downloads/windows/"
  Write-Host "3. Marca la casilla 'Add python.exe to PATH' en el instalador."
  Write-Host "4. Abre una ventana nueva de PowerShell y ejecuta:"
  Write-Host "   cd `"$projectRoot`""
  Write-Host "   Remove-Item -Recurse -Force .venv"
  Write-Host "   python -m venv .venv"
  Write-Host "   .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt"
  Write-Host "   .\start-dev.ps1"
  exit 1
}

function Get-PythonExecutable {
  if ((Test-Path $venvPython) -and (Test-PythonCommand $venvPython)) {
    return $venvPython
  }

  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if ($pythonCommand -and (Test-PythonCommand $pythonCommand.Source)) {
    return $pythonCommand.Source
  }

  $pyCommand = Get-Command py -ErrorAction SilentlyContinue
  if ($pyCommand -and (Test-PythonCommand $pyCommand.Source @('-3', '--version'))) {
    return $pyCommand.Source
  }

  return $null
}

function Get-PythonArguments {
  param([string]$PythonExecutable)

  if ((Split-Path -Leaf $PythonExecutable) -ieq 'py.exe') {
    return @('-3', '-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000')
  }

  return @('-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000')
}

function Join-Command {
  param(
    [string]$Executable,
    [string[]]$Arguments
  )

  $quotedExecutable = "& '" + ($Executable -replace "'", "''") + "'"
  $quotedArguments = $Arguments | ForEach-Object {
    if ($_ -match '[\s:]') {
      "'" + ($_ -replace "'", "''") + "'"
    } else {
      $_
    }
  }

  return (@($quotedExecutable) + $quotedArguments) -join ' '
}

function Get-PythonCommand {
  $pythonExecutable = Get-PythonExecutable
  if (-not $pythonExecutable) {
    Show-PythonHelpAndExit
  }

  return Join-Command $pythonExecutable (Get-PythonArguments $pythonExecutable)
}

function Get-LanIp {
  $ipCandidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object InterfaceMetric

  if ($ipCandidates) {
    return $ipCandidates[0].IPAddress
  }

  return '127.0.0.1'
}

if (-not $ApiHost) {
  $ApiHost = Get-LanIp
}

$apiUrl = "http://$ApiHost:8000"
$pythonCommand = Get-PythonCommand

if (-not $pythonCommand) {
  Write-Error "No se encontro Python funcional. Instala Python 3.11+ y recrea el entorno con: python -m venv .venv"
  exit 1
}

$backendCommand = @(
  "Set-Location '$projectRoot'"
  "`$env:PYTHONIOENCODING='utf-8'"
  "$pythonCommand"
) -join '; '

$frontendCommand = @(
  "Set-Location '$projectRoot\frontend'"
  "`$env:EXPO_PUBLIC_API_URL='$apiUrl'"
  "npx expo start --lan --clear"
) -join '; '

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand | Out-Null
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand | Out-Null

Write-Host "Backend:  http://localhost:8000"
Write-Host "Frontend: http://localhost:8081"
Write-Host "API para APK/telefono: $apiUrl"
Write-Host "Comando de uso: .\start-dev.ps1"
