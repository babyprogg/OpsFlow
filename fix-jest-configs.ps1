# Create jest.config.ts for all libraries that have project.json but not jest.config.ts

$rootDir = (Get-Location).Path

# Find all directories with project.json but without jest.config.ts
Get-ChildItem -Path "libs" -Directory -Recurse | ForEach-Object {
    $libPath = $_.FullName
    $projectJsonPath = Join-Path $libPath "project.json"
    $jestConfigPath = Join-Path $libPath "jest.config.ts"
    
    if ((Test-Path $projectJsonPath) -and (Test-Path $jestConfigPath)) {
        # Calculate relative path depth
        $relativePath = ($libPath -replace [regex]::Escape($rootDir + "\"), "")
        $depth = ($relativePath -split "\\").Count
        $upLevel = ("../" * ($depth - 1))
        
        # Library display name
        $displayName = ($relativePath -replace "\\", "-")
        
        # Coverage directory
        $coverageDir = ($relativePath -replace "\\", "/")
        
        # Read existing jest.config.ts and check if it has syntax errors
        $content = Get-Content $jestConfigPath -Raw
        if ($content -match "\{\{") {
            # Fix the double braces issue
            $content = $content -replace '\{\{', '{' -replace '\}\}', '}'
            $content = $content -replace '\$\{', '$' -replace '\}', '}'
            
            # Also fix the require path
            $content = $content -replace 'require\(.*?jest\.preset\.js.*?\)', "require('$($upLevel)jest.preset.js')"
            $content = $content -replace '<rootDir>/.*?tsconfig\.spec\.json', '<rootDir>/$($upLevel)tsconfig.spec.json'
            $content = $content -replace "coverageDirectory: '.*?'", "coverageDirectory: '../../../coverage/libs/$coverageDir'"
            $content = $content -replace "displayName: '.*?'", "displayName: '$displayName'"
            
            Set-Content -Path $jestConfigPath -Value $content
            Write-Host "Fixed: $jestConfigPath"
        }
    }
}
