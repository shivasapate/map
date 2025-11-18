$port = 8000
$root = (Get-Location).Path

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server running on http://localhost:$port/"
Write-Host "Serving files from: $root"
Write-Host "Press Ctrl+C to stop the server"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $requestPath = $request.Url.LocalPath
    if ($requestPath -eq "/") { $requestPath = "/index.html" }
    
    $filePath = Join-Path $root $requestPath.TrimStart("/").Replace("/", "\")

    if (Test-Path $filePath -PathType Leaf) {
        $file = Get-Item $filePath
        $buffer = [System.IO.File]::ReadAllBytes($filePath)
        
        # Set content type based on file extension
        $ext = $file.Extension
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".js" { "application/javascript; charset=utf-8" }
            ".css" { "text/css; charset=utf-8" }
            ".json" { "application/json; charset=utf-8" }
            ".png" { "image/png" }
            ".jpg" { "image/jpeg" }
            ".gif" { "image/gif" }
            default { "application/octet-stream" }
        }
        
        $response.ContentType = $contentType
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.StatusCode = 200
    } else {
        $response.StatusCode = 404
        $response.ContentType = "text/plain; charset=utf-8"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $requestPath")
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.OutputStream.Close()
    Write-Host "$($request.HttpMethod) $requestPath - $($response.StatusCode)"
}

$listener.Close()
