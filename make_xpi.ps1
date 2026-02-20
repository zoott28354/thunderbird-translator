$src = 'C:\Users\giuli\Documents\GitHub\thunderbird-translator'
$xpiPath = Join-Path $src 'thunderbird-translator.xpi'

# Remove old XPI if exists
if (Test-Path $xpiPath) {
    Remove-Item $xpiPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($xpiPath, 'Create')

# Files to include
$includes = @(
    'manifest.json',
    'background.js',
    'content\translator.js',
    'content\translator.css',
    'options\options.html',
    'options\options.js',
    'options\options.css',
    'icons\translate-48.png',
    'icons\translate-96.png'
)

foreach ($rel in $includes) {
    $full = Join-Path $src $rel
    if (Test-Path $full) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $full, $rel.Replace('\','/'), [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        Write-Host "Added: $rel"
    } else {
        Write-Host "MISSING: $rel"
    }
}

# Add all _locales files
Get-ChildItem -Path (Join-Path $src '_locales') -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\','/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    Write-Host "Added: $rel"
}

$zip.Dispose()
Write-Host "XPI created successfully"
$size = (Get-Item $xpiPath).Length
Write-Host "Size: $size bytes"
