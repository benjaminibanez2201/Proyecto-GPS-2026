param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$AdminEmail = "administrador2024@gmail.cl",
  [string]$AdminPassword = "Admin1234.",
  [string]$EstudianteEmail = "estudiante1@gmail.cl",
  [string]$EstudiantePassword = "Estudiante1234.",
  [string]$ArrendadorEmail = "arrendador1@gmail.cl",
  [string]$ArrendadorPassword = "Arrendador1234.",
  [int]$PublicacionId = 1,
  [int]$UserIdEstudiante = 2,
  [int]$UserIdArrendador = 3,
  [int]$RentalId = 1,
  [switch]$RunMutating
)

$ErrorActionPreference = "Stop"
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [int]$StatusCode,
    [bool]$Passed,
    [string]$Note = ""
  )

  $script:results.Add([PSCustomObject]@{
    Name = $Name
    Method = $Method
    Path = $Path
    Status = $StatusCode
    Result = if ($Passed) { "PASS" } else { "FAIL" }
    Note = $Note
  })
}

function Invoke-RfRequest {
  param(
    [string]$Name,
    [ValidateSet("GET", "POST", "PATCH", "PUT", "DELETE")]
    [string]$Method,
    [string]$Path,
    [string]$Token = "",
    [object]$Body = $null,
    [int[]]$Expected = @(200, 201, 204),
    [switch]$ReturnJson
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $params = @{
    Uri = "$BaseUrl$Path"
    Method = $Method
    Headers = $headers
    TimeoutSec = 20
    UseBasicParsing = $true
  }

  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
  }

  $statusCode = 0
  $content = ""
  $note = ""

  try {
    $response = Invoke-WebRequest @params
    $statusCode = [int]$response.StatusCode
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
      } catch {
        $content = ""
      }
    } else {
      $note = $_.Exception.Message
    }
  }

  $passed = $Expected -contains $statusCode
  Add-Result -Name $Name -Method $Method -Path $Path -StatusCode $statusCode -Passed $passed -Note $note

  if ($ReturnJson) {
    if ($content) {
      try {
        return $content | ConvertFrom-Json
      } catch {
        return $null
      }
    }
    return $null
  }
}

Write-Host "Ejecutando smoke tests contra $BaseUrl"
Write-Host "Mutating: $RunMutating"

$adminLogin = Invoke-RfRequest `
  -Name "RF_12 Login administrador" `
  -Method POST `
  -Path "/auth/login" `
  -Body @{ email = $AdminEmail; password = $AdminPassword } `
  -ReturnJson
$tokenAdmin = $adminLogin.data.token

$estudianteLogin = Invoke-RfRequest `
  -Name "RF_02 Login estudiante" `
  -Method POST `
  -Path "/auth/login" `
  -Body @{ email = $EstudianteEmail; password = $EstudiantePassword } `
  -ReturnJson
$tokenEstudiante = $estudianteLogin.data.token

$arrendadorLogin = Invoke-RfRequest `
  -Name "RF_02 Login arrendador" `
  -Method POST `
  -Path "/auth/login" `
  -Body @{ email = $ArrendadorEmail; password = $ArrendadorPassword } `
  -ReturnJson
$tokenArrendador = $arrendadorLogin.data.token

if (-not $tokenAdmin -or -not $tokenEstudiante -or -not $tokenArrendador) {
  Write-Host ""
  Write-Host "No se obtuvieron todos los tokens. Revisa backend, BD y usuarios semilla."
  $results | Format-Table -AutoSize
  exit 1
}

Invoke-RfRequest -Name "RF_16 Listar usuarios" -Method GET -Path "/user" -Token $tokenAdmin | Out-Null
Invoke-RfRequest -Name "RF_27 Perfil propio estudiante" -Method GET -Path "/profile" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_24 Perfil publico arrendador" -Method GET -Path "/profile/$UserIdArrendador" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_04 Buscar publicaciones" -Method GET -Path "/publicacion?precioMax=350000&tipoInmueble=departamento&ordenarPor=precioMensual&direccionOrden=ASC" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_05 Detalle publicacion" -Method GET -Path "/publicacion/$PublicacionId" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_06/RF_30 Listar favoritos" -Method GET -Path "/favoritos" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_28 Mis publicaciones" -Method GET -Path "/publicacion/mis-publicaciones" -Token $tokenArrendador | Out-Null
Invoke-RfRequest -Name "RF_25 Notificaciones count" -Method GET -Path "/notificaciones/count" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_25 Notificaciones lista" -Method GET -Path "/notificaciones?limit=20&offset=0" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_29 Historial arriendos" -Method GET -Path "/rentals" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_31 Calificaciones recibidas" -Method GET -Path "/reviews/received" -Token $tokenEstudiante | Out-Null
Invoke-RfRequest -Name "RF_15 Reportes admin" -Method GET -Path "/reportes" -Token $tokenAdmin | Out-Null
Invoke-RfRequest -Name "RF_34 Estadisticas publicacion" -Method GET -Path "/publicacion/$PublicacionId/estadisticas" -Token $tokenArrendador -Expected @(200, 404) | Out-Null

if ($RunMutating) {
  Invoke-RfRequest `
    -Name "RF_03 Editar perfil estudiante" `
    -Method PATCH `
    -Path "/profile" `
    -Token $tokenEstudiante `
    -Body @{
      nombreCompleto = "Usuario Estudiante Actualizado"
      universidad = "Universidad del Bio Bio"
      carrera = "Ingenieria Civil Informatica"
    } | Out-Null

  Invoke-RfRequest `
    -Name "RF_06 Guardar favorito" `
    -Method POST `
    -Path "/favoritos" `
    -Token $tokenEstudiante `
    -Body @{ publicacionId = $PublicacionId } `
    -Expected @(200, 201, 400) | Out-Null

  Invoke-RfRequest `
    -Name "RF_30 Eliminar favorito" `
    -Method DELETE `
    -Path "/favoritos/$PublicacionId" `
    -Token $tokenEstudiante `
    -Expected @(200, 400, 404) | Out-Null

  Invoke-RfRequest `
    -Name "RF_22 Editar perfil arrendador" `
    -Method PATCH `
    -Path "/profile/arrendador" `
    -Token $tokenArrendador `
    -Body @{
      nombreCompleto = "Usuario Arrendador Actualizado"
      telefono = "+56 9 2222 3333"
    } | Out-Null

  Invoke-RfRequest `
    -Name "RF_18 Iniciar conversacion" `
    -Method POST `
    -Path "/mensajes/contacto" `
    -Token $tokenEstudiante `
    -Body @{
      id_publicacion = $PublicacionId
      contenido = "Hola, me interesa coordinar una visita."
    } `
    -Expected @(200, 201, 400) | Out-Null
}

Write-Host ""
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.Result -eq "FAIL" }
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "$($failed.Count) prueba(s) fallaron."
  exit 1
}

Write-Host ""
Write-Host "Todas las pruebas ejecutadas pasaron segun los codigos esperados."
