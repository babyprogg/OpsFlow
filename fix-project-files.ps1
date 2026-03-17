$domains = @(
    @{name="client"; tag="domain:client"},
    @{name="contracts"; tag="domain:contracts"},
    @{name="work-orders"; tag="domain:work-orders"},
    @{name="dispatch"; tag="domain:dispatch"},
    @{name="inventory"; tag="domain:inventory"},
    @{name="billing"; tag="domain:billing"},
    @{name="compliance"; tag="domain:compliance"},
    @{name="analytics"; tag="domain:analytics"}
)

$layers = @(
    @{name="domain"; tag="layer:domain"; exports="entities, value-objects, ports"},
    @{name="application"; tag="layer:application"; exports="use-cases, commands, queries"},
    @{name="infrastructure"; tag="layer:infrastructure"; exports="repositories, mappers, stores"},
    @{name="presentation"; tag="layer:presentation"; exports="pages, components, routes"}
)

foreach ($domain in $domains) {
    $domainName = $domain.name
    $domainTag = $domain.tag
    
    foreach ($layer in $layers) {
        $layerName = $layer.name
        $layerTag = $layer.tag
        $exports = $layer.exports
        
        $projectJson = @"
{
  "name": "$domainName-$layerName",
  "`$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/$domainName/$layerName/src",
  "projectType": "library",
  "tags": ["$domainTag", "$layerTag"],
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint"
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/$domainName/$layerName/jest.config.ts"
      }
    }
  }
}
"@
        
        $projectPath = "libs/$domainName/$layerName/project.json"
        
        # Use UTF-8 without BOM
        [System.IO.File]::WriteAllText($projectPath, $projectJson, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Host "Regenerated all domain library configurations with proper encoding!" -ForegroundColor Green
