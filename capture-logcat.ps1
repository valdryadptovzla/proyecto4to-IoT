param(
  [string]$PackageName = 'com.proyecto4to.gestionenergetica',
  [string]$OutputFile = 'android-crash.log'
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localProperties = Join-Path $projectRoot 'frontend\android\local.properties'

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

$sdkPath = Get-AndroidSdkPath
if (-not $sdkPath) {
  throw 'No se pudo resolver el Android SDK.'
}

$adbPath = Join-Path $sdkPath 'platform-tools\adb.exe'
if (-not (Test-Path $adbPath)) {
  throw 'No se encontro adb.exe dentro del Android SDK.'
}

$devices = & $adbPath devices | Select-String '\tdevice$'
if (-not $devices) {
  throw 'No hay un dispositivo Android conectado y autorizado por adb.'
}

$absoluteOutput = Join-Path $projectRoot $OutputFile

Write-Host 'Limpiando logcat...'
& $adbPath logcat -c

Write-Host 'Abre la app en el telefono y reproduce el crash ahora.'
Write-Host "Guardando salida en: $absoluteOutput"

& $adbPath logcat --pid="$(& $adbPath shell pidof $PackageName)" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'No se encontro un proceso activo. Capturando logcat general filtrado por AndroidRuntime y ReactNative.'
  & $adbPath logcat -v time AndroidRuntime:E ReactNative:W ReactNativeJS:W '*:S' | Tee-Object -FilePath $absoluteOutput
  exit $LASTEXITCODE
}