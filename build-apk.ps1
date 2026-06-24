param(
  [switch]$InstallOnDevice
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Join-Path $projectRoot 'frontend'
$androidRoot = Join-Path $frontendRoot 'android'
$localProperties = Join-Path $androidRoot 'local.properties'
$apkPath = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'

function Get-AndroidSdkPath {
  if ($env:ANDROID_SDK_ROOT) {
    return $env:ANDROID_SDK_ROOT
  }

  if ($env:ANDROID_HOME) {
    return $env:ANDROID_HOME
  }

  if (Test-Path $localProperties) {
    $sdkLine = Get-Content $localProperties | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
    if ($sdkLine) {
      return ($sdkLine -replace '^sdk\.dir=', '').Replace('/', '\\')
    }
  }

  return $null
}

function Get-AdbPath {
  $sdkPath = Get-AndroidSdkPath
  if (-not $sdkPath) {
    return $null
  }

  $candidate = Join-Path $sdkPath 'platform-tools\adb.exe'
  if (Test-Path $candidate) {
    return $candidate
  }

  return $null
}

Set-Location $androidRoot
$env:NODE_ENV = 'production'

& .\gradlew.bat assembleRelease --console=plain
if ($LASTEXITCODE -ne 0) {
  throw 'La compilacion release fallo.'
}

if (-not (Test-Path $apkPath)) {
  throw 'No se encontro la APK generada.'
}

Write-Host "APK generada en: $apkPath"

if (-not $InstallOnDevice) {
  return
}

$adbPath = Get-AdbPath
if (-not $adbPath) {
  throw 'No se encontro adb. Revisa el Android SDK o local.properties.'
}

$devices = & $adbPath devices | Select-String '\tdevice$'
if (-not $devices) {
  throw 'No hay un dispositivo Android conectado y autorizado por adb.'
}

& $adbPath install -r $apkPath
if ($LASTEXITCODE -ne 0) {
  throw 'La instalacion de la APK fallo.'
}

Write-Host 'APK instalada correctamente en el dispositivo conectado.'