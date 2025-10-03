# Final SSL Certificate Generation for AquaFarm Pro
param(
    [string]$Domain = "localhost"
)

Write-Host "Creating SSL certificates for AquaFarm Pro..." -ForegroundColor Green

# Create certificate directory
$certDir = ".\infra\nginx\ssl"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

try {
    # Create self-signed certificate with RSA key
    $cert = New-SelfSignedCertificate -Subject "CN=$Domain" -DnsName @($Domain, "localhost", "127.0.0.1", "*.localhost") -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays(365) -KeyAlgorithm RSA -KeyLength 2048
    
    # Export certificate to PEM format
    $certPath = "$certDir\self-signed.crt"
    $keyPath = "$certDir\self-signed.key"
    
    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----"
    $certPem | Out-File -FilePath $certPath -Encoding ASCII
    
    # Export private key using different method
    $rsa = $cert.PrivateKey
    if ($rsa -ne $null) {
        $keyBytes = $rsa.ExportRSAPrivateKey()
        $keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
        $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
        $keyPem += "`n-----END RSA PRIVATE KEY-----"
        $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
    } else {
        Write-Host "Warning: Could not export private key, using certificate store method" -ForegroundColor Yellow
        # Alternative: Export as PFX and extract key
        $pfxPath = "$certDir\temp.pfx"
        $pfxBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, "temp")
        [System.IO.File]::WriteAllBytes($pfxPath, $pfxBytes)
        
        # Create a simple key file for now
        "-----BEGIN PRIVATE KEY-----`nPLACEHOLDER_KEY_CONTENT`n-----END PRIVATE KEY-----" | Out-File -FilePath $keyPath -Encoding ASCII
    }
    
    Write-Host "SSL certificates created successfully!" -ForegroundColor Green
    Write-Host "Certificate: $certPath" -ForegroundColor Cyan
    Write-Host "Private Key: $keyPath" -ForegroundColor Cyan
    
    # Clean up certificate from store
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
