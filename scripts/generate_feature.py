#!/usr/bin/env python3
"""
Proprietary Generate Feature Script for Meqenet.et

This script generates NestJS features within specific microservices using Nx generators.
It creates controllers, services, modules, and DTOs following our Feature-Sliced Architecture.

Author: Meqenet.et
"""

import subprocess
import sys
import os
import re
import argparse
from pathlib import Path


def run_command(command: list, cwd: str = None, check: bool = True) -> subprocess.CompletedProcess:
    """Execute a command and return the result."""
    try:
        print(f"Running: {' '.join(command)}")
        if cwd:
            print(f"Working directory: {cwd}")
        
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=check
        )
        
        if result.stdout:
            print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Stderr: {result.stderr}")
            
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(f"Return code: {e.returncode}")
        if e.stdout:
            print(f"Stdout: {e.stdout}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        raise


def get_workspace_root() -> Path:
    """Get the workspace root directory."""
    script_dir = Path(__file__).parent
    return script_dir.parent


def list_services() -> list:
    """List available microservices."""
    workspace_root = get_workspace_root()
    services_dir = workspace_root / "backend" / "services"
    
    if not services_dir.exists():
        print(f"Services directory not found: {services_dir}")
        return []
    
    services = []
    for item in services_dir.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            services.append(item.name)
    
    return sorted(services)


def validate_feature_name(feature_name: str) -> bool:
    """Validate feature name follows our conventions."""
    if not feature_name:
        return False
    
    # Feature name should be kebab-case
    if not feature_name.islower():
        return False
    
    # Should not contain spaces or special characters except hyphens
    allowed_chars = set('abcdefghijklmnopqrstuvwxyz0123456789-')
    if not all(c in allowed_chars for c in feature_name):
        return False
    
    return True


def update_app_module(service_name: str, feature_name: str, workspace_root: Path) -> bool:
    """Automatically update the app.module.ts file to import the new feature module."""
    try:
        # Convert kebab-case to PascalCase for module name
        # e.g., 'user-management' -> 'UserManagement'
        module_class_name = ''.join(word.capitalize() for word in feature_name.split('-'))
        module_class_name += 'Module'
        
        # Paths
        app_module_path = workspace_root / "backend" / "services" / service_name / "src" / "app" / "app.module.ts"
        feature_relative_path = f"../features/{feature_name}/{feature_name}.module"
        
        if not app_module_path.exists():
            print(f"⚠️  Warning: app.module.ts not found at {app_module_path}")
            return False
        
        # Read the current app.module.ts content
        with open(app_module_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if the import already exists
        import_statement = f"import {{ {module_class_name} }} from '{feature_relative_path}';"
        if import_statement in content:
            print(f"✅ {module_class_name} is already imported in app.module.ts")
            return True
        
        # Step 1: Add the import statement
        # Find where to insert the import (after AuthModule import if it exists)
        lines = content.split('\n')
        import_inserted = False
        
        for i, line in enumerate(lines):
            if 'AuthModule' in line and 'import' in line:
                # Insert after AuthModule import
                lines.insert(i + 1, import_statement)
                import_inserted = True
                break
        
        if not import_inserted:
            # Fallback: find the last import statement
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('import ') and '../features/' in lines[i]:
                    lines.insert(i + 1, import_statement)
                    import_inserted = True
                    break
        
        if not import_inserted:
            print(f"⚠️  Warning: Could not find appropriate place to add import statement")
            return False
        
        # Step 2: Add the module to the imports array
        # Find the imports array and add our module after AuthModule
        updated_content = '\n'.join(lines)
        
        # Look for AuthModule in the imports array and add our module after it
        auth_module_pattern = r'(\s+AuthModule,)'
        if re.search(auth_module_pattern, updated_content):
            # Add after AuthModule
            replacement = f'\\1\n    {module_class_name},'
            updated_content = re.sub(auth_module_pattern, replacement, updated_content)
        else:
            # Fallback: add before DatabaseModule if it exists
            db_module_pattern = r'(\s+)(DatabaseModule,)'
            if re.search(db_module_pattern, updated_content):
                replacement = f'\\1{module_class_name},\n\\1\\2'
                updated_content = re.sub(db_module_pattern, replacement, updated_content)
            else:
                print(f"⚠️  Warning: Could not find appropriate place to add module to imports array")
                return False
        
        # Write the updated content back to the file
        with open(app_module_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Successfully added {module_class_name} to app.module.ts")
        return True
        
    except Exception as e:
        print(f"❌ Error updating app.module.ts: {e}")
        return False


def enhance_generated_files(
    service_name: str, 
    feature_name: str, 
    workspace_root: Path
) -> None:
    """
    Enhances the generated files with project-specific standards.
    - Adds Swagger decorators to the controller.
    - Improves test stubs for controller and service.
    """
    print("\nEnhancing generated files with project standards...")
    
    feature_path = workspace_root / "backend" / "services" / service_name / "src" / "features" / feature_name
    pascal_case_feature_name = "".join(word.capitalize() for word in feature_name.split("-"))
    create_dto_class = f"Create{pascal_case_feature_name}Dto"

    # --- Create Base DTO ---
    dto_path = feature_path / "dto"
    base_dto_path = dto_path / f"{feature_name}.dto.ts"
    if not base_dto_path.exists():
        base_dto_content = f"""
import {{ ApiProperty }} from '@nestjs/swagger';

export class {pascal_case_feature_name}Dto {{
  @ApiProperty({{
    description: 'The unique identifier of the item',
    example: 'clq8p2x9r0000c2e3f4g5h6j7',
  }})
  id: string;

  @ApiProperty({{
    description: 'The timestamp when the item was created',
    example: '2023-01-01T12:00:00.000Z',
  }})
  createdAt: Date;

  @ApiProperty({{
    description: 'The timestamp when the item was last updated',
    example: '2023-01-01T12:00:00.000Z',
  }})
  updatedAt: Date;
}}
"""
        with open(base_dto_path, "w", encoding="utf-8") as f:
            f.write(base_dto_content)
        print(f"✅ Created base DTO: {base_dto_path.name}")

    # --- Enhance Controller ---
    controller_path = feature_path / f"{feature_name}.controller.ts"
    if controller_path.exists():
        with open(controller_path, "r+", encoding="utf-8") as f:
            content = f.read()
            
            # Add imports
            new_imports = [
                "import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';",
                f"import {{ {pascal_case_feature_name}Dto }} from './dto/{feature_name}.dto';"
            ]
            content = content.replace(
                "import {",
                f"{new_imports[0]}\n{new_imports[1]}\n\nimport {{"
            )
            
            # Add ApiTags
            content = content.replace(
                f"@Controller('{feature_name}')",
                f"@ApiTags('{pascal_case_feature_name}')\n@Controller('{feature_name}')"
            )
            
            # Add decorators to methods
            # Create
            content = content.replace(
                "@Post()",
                f"@Post()\\n  @ApiOperation({{ summary: 'Create a new item' }})\\n  @ApiResponse({{ status: 201, description: 'The item has been successfully created.', type: {pascal_case_feature_name}Dto }})\\n  @ApiResponse({{ status: 400, description: 'Bad Request.' }})\\n  @ApiBody({{ type: {create_dto_class} }})"
            )
            # FindAll
            content = content.replace(
                "@Get()",
                "@Get()\n  @ApiOperation({ summary: 'Retrieve all items' })\n  @ApiResponse({ status: 200, description: 'A list of items.', isArray: true, type: {pascal_case_feature_name}Dto })"
            )
            # FindOne
            content = content.replace(
                "@Get(':id')",
                "@Get(':id')\n  @ApiOperation({ summary: 'Retrieve a single item by ID' })\n  @ApiResponse({ status: 200, description: 'A single item.', type: {pascal_case_feature_name}Dto })\n  @ApiResponse({ status: 404, description: 'Item not found.' })"
            )
            # Update
            content = content.replace(
                "@Patch(':id')",
                "@Patch(':id')\n  @ApiOperation({ summary: 'Update an existing item' })\n  @ApiResponse({ status: 200, description: 'The updated item.', type: {pascal_case_feature_name}Dto })\n  @ApiResponse({ status: 404, description: 'Item not found.' })"
            )
            # Remove
            content = content.replace(
                "@Delete(':id')",
                "@Delete(':id')\n  @ApiOperation({ summary: 'Delete an item' })\n  @ApiResponse({ status: 204, description: 'The item has been successfully deleted.' })"
            )

            f.seek(0)
            f.write(content)
            f.truncate()
            print(f"✅ Enhanced controller: {controller_path.name}")

    # Enhance spec files
    _enhance_controller_spec(feature_path, feature_name, pascal_case_feature_name)
    _enhance_service_spec(feature_path, feature_name, pascal_case_feature_name)


def _enhance_controller_spec(feature_path: Path, feature_name: str, pascal_case_feature_name: str):
    """Enhances the generated controller spec file with meaningful tests."""
    spec_path = feature_path / f"{feature_name}.controller.spec.ts"
    if not spec_path.exists():
        print(f"⚠️  Warning: Controller spec not found at {spec_path}")
        return

    service_class = f"{pascal_case_feature_name}Service"
    controller_class = f"{pascal_case_feature_name}Controller"
    create_dto_class = f"Create{pascal_case_feature_name}Dto"
    update_dto_class = f"Update{pascal_case_feature_name}Dto"
    base_dto_class = f"{pascal_case_feature_name}Dto"

    content = f"""
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ {controller_class} }} from './{feature_name}.controller';
import {{ {service_class} }} from './{feature_name}.service';
import {{ {create_dto_class} }} from './dto/create-{feature_name}.dto';
import {{ {update_dto_class} }} from './dto/update-{feature_name}.dto';
import {{ {base_dto_class} }} from './dto/{feature_name}.dto';

// A mock implementation of the DTO for testing purposes.
// Adjust the properties to match your actual DTO.
const mockDto: {base_dto_class} = {{
  id: 'clq8p2x9r0000c2e3f4g5h6j7',
  createdAt: new Date(),
  updatedAt: new Date(),
}};

// Mock the service to isolate the controller during tests.
const mock{service_class} = {{
  create: jest.fn().mockResolvedValue(mockDto),
  findAll: jest.fn().mockResolvedValue([mockDto]),
  findOne: jest.fn().mockResolvedValue(mockDto),
  update: jest.fn().mockResolvedValue(mockDto),
  remove: jest.fn().mockResolvedValue(undefined), // remove usually returns void
}};

describe('{controller_class}', () => {{
  let controller: {controller_class};
  let service: {service_class};

  beforeEach(async () => {{
    const module: TestingModule = await Test.createTestingModule({{
      controllers: [{controller_class}],
      providers: [
        {{
          provide: {service_class},
          useValue: mock{service_class},
        }},
      ],
    }}).compile();

    controller = module.get<{controller_class}>({controller_class});
    service = module.get<{service_class}>({service_class});
  }});

  it('should be defined', () => {{
    expect(controller).toBeDefined();
  }});

  describe('create', () => {{
    it('should create an item and return it', async () => {{
      const createDto: {create_dto_class} = {{
        // TODO: Populate with required properties from your Create DTO
      }};
      await expect(controller.create(createDto)).resolves.toEqual(mockDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
    }});
  }});

  describe('findAll', () => {{
    it('should return an array of items', async () => {{
      await expect(controller.findAll()).resolves.toEqual([mockDto]);
      expect(service.findAll).toHaveBeenCalled();
    }});
  }});

  describe('findOne', () => {{
    it('should return a single item by id', async () => {{
      const id = '1';
      await expect(controller.findOne(id)).resolves.toEqual(mockDto);
      expect(service.findOne).toHaveBeenCalledWith(id);
    }});
  }});

  describe('update', () => {{
    it('should update an item and return it', async () => {{
      const id = '1';
      const updateDto: {update_dto_class} = {{
        // TODO: Populate with properties from your Update DTO
      }};
      await expect(controller.update(id, updateDto)).resolves.toEqual(mockDto);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    }});
  }});

  describe('remove', () => {{
    it('should remove an item successfully', async () => {{
      const id = '1';
      await expect(controller.remove(id)).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(id);
    }});
  }});
}});
"""
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Enhanced controller spec: {spec_path.name}")


def _enhance_service_spec(feature_path: Path, feature_name: str, pascal_case_feature_name: str):
    """Enhances the generated service spec file with Prisma mock."""
    spec_path = feature_path / f"{feature_name}.service.spec.ts"
    if not spec_path.exists():
        print(f"⚠️  Warning: Service spec not found at {spec_path}")
        return

    service_class = f"{pascal_case_feature_name}Service"
    prisma_model_name = feature_name.replace('-', '_') # Heuristic for model name

    content = f"""
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ {service_class} }} from './{feature_name}.service';
import {{ PrismaService }} from '../../infrastructure/database/prisma.service';

// Mock Prisma service for testing purposes.
// This allows testing the service logic without a real database connection.
const mockPrismaService = {{
  {prisma_model_name}: {{
    create: jest.fn().mockResolvedValue({{ id: '1' }}),
    findMany: jest.fn().mockResolvedValue([{{ id: '1' }}]),
    findUnique: jest.fn().mockResolvedValue({{ id: '1' }}),
    update: jest.fn().mockResolvedValue({{ id: '1' }}),
    delete: jest.fn().mockResolvedValue({{ id: '1' }}),
  }},
}};

describe('{service_class}', () => {{
  let service: {service_class};
  let prisma: PrismaService;

  beforeEach(async () => {{
    const module: TestingModule = await Test.createTestingModule({{
      providers: [
        {service_class},
        {{
          provide: PrismaService,
          useValue: mockPrismaService,
        }},
      ],
    }}).compile();

    service = module.get<{service_class}>({service_class});
    prisma = module.get<PrismaService>(PrismaService);
  }});

  it('should be defined', () => {{
    expect(service).toBeDefined();
  }});

  // TODO: Add more detailed tests for each method in your service.
  // Example for a 'findAll' method:
  describe('findAll', () => {{
    it('should call prisma.{prisma_model_name}.findMany and return the result', async () => {{
      const result = await service.findAll();
      expect(result).toEqual([{{ id: '1' }}]);
      expect(prisma.{prisma_model_name}.findMany).toHaveBeenCalled();
    }});
  }});
  
}});
"""
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Enhanced service spec: {spec_path.name}")


def print_curl_commands(service_name: str, feature_name: str, workspace_root: Path) -> None:
    """Prints a list of curl commands for the generated CRUD endpoints."""
    
    # This is a bit of a guess, we should ideally get the port from config.
    # For now, we'll look for it in the main.ts file.
    port = 3002 # default
    main_ts_path = workspace_root / "backend" / "services" / service_name / "src" / "main.ts"
    if main_ts_path.exists():
        with open(main_ts_path, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r"const port =.*?\??\s*(\d{4})", content)
            if match:
                port = int(match.group(1))

    base_url = f"http://localhost:{port}/{feature_name}"
    
    print("\n✅ API Endpoint Testing Commands (curl):")
    print("-" * 50)
    
    # POST
    print(f"# 1. Create a new {feature_name}")
    print(f"curl -X POST {base_url} \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"name\": \"Test Item\", \"description\": \"A test item description.\"}'\n")
    
    # GET all
    print(f"# 2. Get all {feature_name}s")
    print(f"curl {base_url}\n")
    
    # GET one
    print(f"# 3. Get one {feature_name} by ID (replace '1' with an actual ID)")
    print(f"curl {base_url}/1\n")
    
    # PATCH
    print(f"# 4. Update a {feature_name} by ID (replace '1' with an actual ID)")
    print(f"curl -X PATCH {base_url}/1 \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"description\": \"An updated description.\"}'\n")
    
    # DELETE
    print(f"# 5. Delete a {feature_name} by ID (replace '1' with an actual ID)")
    print(f"curl -X DELETE {base_url}/1\n")
    
    print("-" * 50)


def generate_feature(service_name: str, feature_name: str, workspace_root: Path):
    """Generate a NestJS feature using Nx."""
    
    # Validate inputs
    if not validate_feature_name(feature_name):
        raise ValueError(f"Invalid feature name: {feature_name}. Use kebab-case (e.g., 'user-management')")
    
    service_path = workspace_root / "backend" / "services" / service_name
    if not service_path.exists():
        raise ValueError(f"Service not found: {service_name}")
    
    print(f"Generating feature '{feature_name}' in service '{service_name}'...")
    
    # Target directory for the feature (following Feature-Sliced Architecture)
    # Features go in: backend/services/{service}/src/features/{feature}
    target_directory = f"backend/services/{service_name}/src/features/{feature_name}"
    
    try:
        # Generate the feature using Nx Nest resource generator
        # Use the full path approach since Nest generators don't support --nameAndDirectoryFormat yet
        resource_path = f"{target_directory}/{feature_name}"
        command = [
            "pnpm", "exec", "nx", "generate", "@nx/nest:resource",
            resource_path,
            "--type", "rest",
            "--crud",
            "--no-interactive"
        ]
        
        result = run_command(command, cwd=str(workspace_root))
        
        print(f"✅ Successfully generated feature '{feature_name}' in service '{service_name}'")
        print(f"📁 Files created in: {target_directory}")
        
        # Show what was created
        feature_path = workspace_root / target_directory
        if feature_path.exists():
            print("\n📋 Generated files:")
            for file in sorted(feature_path.rglob("*")):
                if file.is_file():
                    relative_path = file.relative_to(workspace_root)
                    print(f"  - {relative_path}")
        
        # NEW: Enhance the files and provide final instructions
        enhance_generated_files(service_name, feature_name, workspace_root)
        
        # Automatically update the app.module.ts file
        print(f"\n🔄 Updating app.module.ts to import {feature_name} module...")
        module_updated = update_app_module(service_name, feature_name, workspace_root)
        if not module_updated:
            print("⚠️  Please manually add the module import to app.module.ts")
        
        # NEW: Print curl commands for easy testing
        print_curl_commands(service_name, feature_name, workspace_root)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate feature: {e}")
        return False


def main():
    """Main function to run the script."""
    
    parser = argparse.ArgumentParser(
        description="Meqenet Feature Generator",
        epilog="Example: python scripts/generate_feature.py test-service user-profile"
    )
    parser.add_argument(
        "service_name", 
        nargs="?", 
        help="Name of the service to add the feature to (e.g., 'test-service')."
    )
    parser.add_argument(
        "feature_name", 
        nargs="?", 
        help="Name of the new feature in kebab-case (e.g., 'user-profile')."
    )
    args = parser.parse_args()

    try:
        workspace_root = get_workspace_root()
        if not workspace_root:
            print("❌ Error: Could not find the project root. Make sure you're running this from within the Meqenet repo.")
            sys.exit(1)

        service_name = args.service_name
        feature_name = args.feature_name

        # --- Get Service Name ---
        if not service_name:
            print("🚀 Welcome to the Meqenet Feature Generator!")
            services = list_services()
            if not services:
                print("❌ No microservices found in 'backend/services'.")
                sys.exit(1)

            print("\nAvailable microservices:")
            for i, service in enumerate(services, 1):
                print(f"  {i}. {service}")
            
            choice = input(f"\n👉 Select a service to add the feature to (1-{len(services)}): ")
            try:
                service_index = int(choice) - 1
                if not 0 <= service_index < len(services):
                    raise ValueError
                service_name = services[service_index]
            except (ValueError, IndexError):
                print("❌ Invalid selection. Exiting.")
                sys.exit(1)
        
        print(f"✅ Using service: {service_name}")

        # --- Get Feature Name ---
        if not feature_name:
            feature_name = input("👉 Enter the feature name (e.g., 'user-profile', 'payment-gateway'): ").strip()
        
        if not validate_feature_name(feature_name):
            print("❌ Invalid feature name. Please use kebab-case (e.g., 'my-feature').")
            sys.exit(1)

        # Generate the feature
        success = generate_feature(service_name, feature_name, workspace_root)
        
        if success:
            print(f"\n🎉 Feature '{feature_name}' generated and enhanced successfully!")
            print(f"📝 Remember to:")
            print(f"  1. Add any necessary dependencies")
            print(f"  2. Update API documentation")
            print(f"  3. Write tests for the new feature")
            print(f"  4. Test the endpoints in your API client")
        else:
            print(f"\n❌ Failed to generate feature '{feature_name}' in service '{service_name}'")

    except KeyboardInterrupt:
        print("\n👋 Operation cancelled by user. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 