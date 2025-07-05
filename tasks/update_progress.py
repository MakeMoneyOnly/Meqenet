import yaml
from pathlib import Path
from datetime import datetime

def get_subtasks_for_platform(stages, platform_name):
    """Filters stages and tasks for a specific platform."""
    filtered_stages = []
    for stage_data in stages:
        platform_tasks = [
            task for task in stage_data['tasks'] 
            if task.get('platform') in [platform_name, 'Both']
        ]
        if platform_tasks:
            # Create a new stage dict with filtered tasks
            filtered_stage = stage_data.copy()
            filtered_stage['tasks'] = platform_tasks
            filtered_stages.append(filtered_stage)
    return filtered_stages

def generate_markdown_for_platform(stages, platform_name, output_filename):
    """Generates a Markdown file for a specific platform (App, Website)."""
    content = f"# {platform_name} Development Progress\n\n"
    content += f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC_\n\n"
    content += "This document tracks the development progress of the Meqenet platform. It is auto-generated from `tasks.yaml`.\n\n"

    platform_stages = get_subtasks_for_platform(stages, platform_name)

    for stage_data in platform_stages:
        content += f"## {stage_data['stage']}\n\n"
        for task in stage_data['tasks']:
            content += f"### {task['name']} (`{task['id']}`)\n\n"
            for subtask in task.get('subtasks', []):
                checkbox = "- [x]" if subtask.get('status') == 'Done' else "- [ ]"
                content += f"{checkbox} **{subtask['id']}**: {subtask['description']}\n"
            content += "\n"
        content += "---\n\n"

    Path(output_filename).write_text(content, encoding='utf-8')
    print(f"Successfully generated {output_filename}")

def generate_master_markdown(stages, output_filename):
    """Generates the Master Progress Markdown file."""
    content = "# Master Development Progress\n\n"
    content += f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC_\n\n"
    content += "This document provides a master view of all development tasks for the Meqenet platform. It is auto-generated from `tasks.yaml`.\n\n"

    all_subtasks = [
        subtask for stage in stages for task in stage['tasks'] for subtask in task.get('subtasks', [])
    ]
    
    total_tasks = len(all_subtasks)
    completed_tasks = sum(1 for task in all_subtasks if task.get('status') == 'Done')
    progress = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0
    
    progress_bar_length = 40
    filled_length = int(progress_bar_length * progress // 100)
    bar = '█' * filled_length + '-' * (progress_bar_length - filled_length)
    
    content += f"## Overall Progress\n\n"
    content += f"**{completed_tasks} / {total_tasks} Sub-tasks Completed**\n\n"
    content += f"`[{bar}] {progress:.2f}%`\n\n"
    
    for stage_data in stages:
        content += f"## {stage_data['stage']}\n\n"
        for task in stage_data['tasks']:
            platform_emoji = "📱" if task.get('platform') == 'App' else "🌐" if task.get('platform') == 'Website' else "🚀"
            content += f"### {platform_emoji} {task['name']} (`{task['id']}`)\n\n"
            
            subtasks = task.get('subtasks', [])
            if not subtasks:
                content += "_No sub-tasks defined._\n\n"
            else:
                for subtask in subtasks:
                    checkbox = "- [x]" if subtask.get('status') == 'Done' else "- [ ]"
                    content += f"{checkbox} **{subtask['id']}**: {subtask['description']}\n"
                    # Optionally, add context files back in if needed
                    if 'context' in subtask and subtask['context']:
                         content += "    - **Context**: " + ", ".join([f"`{f}`" for f in subtask['context']]) + "\n"

                content += "\n"
        content += "---\n\n"

    Path(output_filename).write_text(content, encoding='utf-8')
    print(f"Successfully generated {output_filename}")


def main():
    """Main function to run the script."""
    try:
        print("--- Script Starting ---")
        script_dir = Path(__file__).parent
        print(f"Script directory: {script_dir}")
        
        tasks_file = script_dir / 'tasks.yaml'
        print(f"Attempting to read tasks file: {tasks_file}")
        
        # Load the YAML data, which is now a dictionary with a 'stages' key
        tasks_data = yaml.safe_load(tasks_file.read_text(encoding='utf-8'))
        stages = tasks_data.get('stages', [])
        print("Tasks file read and parsed successfully.")
        
        output_dir = script_dir
        output_dir.mkdir(exist_ok=True)
        print(f"Output directory: {output_dir}")

        print("Generating App progress file...")
        generate_markdown_for_platform(stages, 'App', output_dir / 'App_Progress.md')
        
        print("Generating Website progress file...")
        generate_markdown_for_platform(stages, 'Website', output_dir / 'Website_Progress.md')
        
        print("Generating Master progress file...")
        generate_master_markdown(stages, output_dir / 'Master_Progress.md')
        
        print("\n--- Script Finished ---")
        print("All progress files generated successfully.")

    except FileNotFoundError:
        print(f"Error: The file '{tasks_file}' was not found. It must be in the same directory as the script.")
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main() 