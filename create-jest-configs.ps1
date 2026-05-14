# Script to create jest.config.ts for all libraries that don't have one
$libDirs = Get-ChildItem -Path "libs" -Directory -Recurse
$templateContent = @'
/* eslint-disable */
const nxPreset = require('{relPath}jest.preset.js');

export default {{
  ...nxPreset,
  displayName: '{displayName}',
  testEnvironment: 'node',
  transform: {{
    '^.+\\.[tj]s$': ['ts-jest', {{ tsconfig: '<rootDir>/{tsconfig}' }}]
  }},
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '{coverageDir}',
  setupFilesAfterEnv: undefined
}};
'@

foreach ($libDir in $libDirs) {
    $projectJson = Join-Path $libDir.FullName "project.json"
    if ((Test-Path $projectJson) -and -not (Test-Path "$($libDir.FullName)/jest.config.ts")) {
        # Calculate the relative path from the lib to the root
        $depth = ($libDir.FullName | Measure-Object -Character).Characters - (Get-Location).Path.Length - 1
        $levels = ($libDir.FullName -split '\\' | Where-Object { $_ -ne 'libs' }).Count - 1
        $relPath = ("../" * $levels) + "../"
        
        # Get library name for display
        $displayName = ($libDir.FullName -replace "^.*libs[\\/]" -replace "[\\/]", "-")
        
        # Get coverage directory
        $coverageDir = ($libDir.FullName -replace "^.*libs[\\/]" -replace "[\\/]", "/")
        $coverageDir = "../../../coverage/libs/$coverageDir"
        
        $tsconfig = "$relPath../tsconfig.spec.json"
        
        $content = $templateContent -replace '{relPath}', $relPath -replace '{displayName}', $displayName -replace '{coverageDir}', $coverageDir -replace '{tsconfig}', $tsconfig
        
        $jestConfigPath = Join-Path $libDir.FullName "jest.config.ts"
        Set-Content -Path $jestConfigPath -Value $content
        Write-Host "Created: $jestConfigPath"
    }
}
