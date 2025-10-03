# Create exportable SSL certificates for AquaFarm Pro
param(
    [string]$Domain = "localhost"
)

Write-Host "Creating exportable SSL certificates for AquaFarm Pro..." -ForegroundColor Green

# Create certificate directory
$certDir = ".\infra\nginx\ssl"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

try {
    # Create a new self-signed certificate with exportable key
    $cert = New-SelfSignedCertificate -Subject "CN=$Domain" -DnsName @($Domain, "localhost", "127.0.0.1", "*.localhost") -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays(365) -KeyAlgorithm RSA -KeyLength 2048 -KeyUsage DigitalSignature, KeyEncipherment -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") -KeyExportPolicy Exportable
    
    # Export certificate to PEM format
    $certPath = "$certDir\self-signed.crt"
    $keyPath = "$certDir\self-signed.key"
    
    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----"
    $certPem | Out-File -FilePath $certPath -Encoding ASCII
    
    # Export private key using PKCS#8 format
    $rsa = $cert.PrivateKey
    if ($rsa -ne $null) {
        # Try PKCS#8 format first
        try {
            $keyBytes = $rsa.ExportPkcs8PrivateKey()
            $keyPem = "-----BEGIN PRIVATE KEY-----`n"
            $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
            $keyPem += "`n-----END PRIVATE KEY-----"
            $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
            Write-Host "Private key exported in PKCS#8 format" -ForegroundColor Green
        } catch {
            # Fallback to RSA format
            try {
                $keyBytes = $rsa.ExportRSAPrivateKey()
                $keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
                $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
                $keyPem += "`n-----END RSA PRIVATE KEY-----"
                $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
                Write-Host "Private key exported in RSA format" -ForegroundColor Green
            } catch {
                Write-Host "Error: Could not export private key in any format" -ForegroundColor Red
                Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host "SSL certificates created successfully!" -ForegroundColor Green
        Write-Host "Certificate: $certPath" -ForegroundColor Cyan
        Write-Host "Private Key: $keyPath" -ForegroundColor Cyan
        
        # Display certificate info
        Write-Host "`nCertificate Information:" -ForegroundColor Yellow
        Write-Host "Subject: $($cert.Subject)" -ForegroundColor White
        Write-Host "Valid From: $($cert.NotBefore)" -ForegroundColor White
        Write-Host "Valid Until: $($cert.NotAfter)" -ForegroundColor White
        Write-Host "Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
        
    } else {
        Write-Host "Error: Could not access private key" -ForegroundColor Red
        exit 1
    }
    
    # Clean up certificate from store
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
