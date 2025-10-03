# Extract private key from PFX certificate
param(
    [string]$PfxPath = ".\infra\nginx\ssl\self-signed.pfx",
    [string]$KeyPath = ".\infra\nginx\ssl\self-signed.key"
)

Write-Host "Extracting private key from PFX certificate..." -ForegroundColor Green

try {
    # Load the PFX certificate
    $pfxBytes = [System.IO.File]::ReadAllBytes($PfxPath)
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxBytes, "", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    
    # Export the private key
    $rsa = $cert.PrivateKey
    if ($rsa -ne $null) {
        $keyBytes = $rsa.ExportRSAPrivateKey()
        $keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
        $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
        $keyPem += "`n-----END RSA PRIVATE KEY-----"
        $keyPem | Out-File -FilePath $KeyPath -Encoding ASCII
        
        Write-Host "Private key extracted successfully!" -ForegroundColor Green
        Write-Host "Key saved to: $KeyPath" -ForegroundColor Cyan
    } else {
        Write-Host "Error: Could not access private key from certificate" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
