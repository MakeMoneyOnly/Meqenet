#!/usr/bin/env python3
"""
Meqenet Progress Report Generator

This script generates comprehensive progress reports from the tasks.yaml file,
creating separate markdown files for App, Website, and Master views.

Features:
- Validates task structure and data integrity
- Generates platform-specific progress reports
- Creates visual progress bars and statistics
- Enhanced error handling and logging
- Cross-platform compatibility

Usage:
    python update_progress.py

Output files:
- Master_Progress.md: Complete overview of all tasks
- App_Progress.md: Mobile app specific progress
- Website_Progress.md: Web platform specific progress
"""

import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('progress_generator.log', mode='w')
    ]
)
logger = logging.getLogger(__name__)

def validate_task_structure(task: Dict[str, Any]) -> bool:
    """Validate that a task has the required structure."""
    required_fields = ['id', 'name', 'platform']
    for field in required_fields:
        if field not in task:
            logger.warning(f"Task missing required field '{field}': {task.get('id', 'Unknown ID')}")
            return False

    if 'subtasks' not in task:
        logger.warning(f"Task has no subtasks: {task['id']}")
        return False

    return True

def get_subtasks_for_platform(stages: List[Dict[str, Any]], platform_name: str) -> List[Dict[str, Any]]:
    """Filters stages and tasks for a specific platform with improved validation."""
    filtered_stages = []
    total_tasks_processed = 0

    for stage_data in stages:
        platform_tasks = []
        for task in stage_data['tasks']:
            total_tasks_processed += 1

            # Validate task structure
            if not validate_task_structure(task):
                continue

            # Check platform compatibility
            task_platform = task.get('platform', 'Both')
            if task_platform in [platform_name, 'Both']:
                platform_tasks.append(task)

        if platform_tasks:
            # Create a new stage dict with filtered tasks
            filtered_stage = stage_data.copy()
            filtered_stage['tasks'] = platform_tasks
            filtered_stages.append(filtered_stage)

    logger.info(f"Filtered {len(filtered_stages)} stages with {sum(len(s['tasks']) for s in filtered_stages)} tasks for platform '{platform_name}' from {total_tasks_processed} total tasks")
    return filtered_stages

def create_progress_bar(percentage: float, length: int = 40) -> str:
    """Create a visual progress bar string."""
    filled_length = int(length * percentage // 100)
    bar = '█' * filled_length + '-' * (length - filled_length)
    return bar

def calculate_progress(subtasks: List[Dict[str, Any]]) -> tuple[int, int, float]:
    """Calculate completion statistics for a list of subtasks."""
    total_tasks = len(subtasks)
    completed_tasks = sum(1 for task in subtasks if task.get('status') == 'Completed')
    progress_percentage = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0
    return completed_tasks, total_tasks, progress_percentage

def generate_markdown_for_platform(stages: List[Dict[str, Any]], platform_name: str, output_filename: Path) -> None:
    """Generates a Markdown file for a specific platform (App, Website) with enhanced features."""
    logger.info(f"Generating markdown for platform: {platform_name}")

    content = f"# {platform_name} Development Progress\n\n"
    content += f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC_\n\n"
    content += "This document tracks the development progress of the Meqenet platform. It is auto-generated from `tasks.yaml`.\n\n"

    platform_stages = get_subtasks_for_platform(stages, platform_name)

    # Calculate progress for this platform
    platform_subtasks = []
    for stage in platform_stages:
        for task in stage['tasks']:
            platform_subtasks.extend(task.get('subtasks', []))

    completed_tasks, total_tasks, progress_percentage = calculate_progress(platform_subtasks)
    progress_bar = create_progress_bar(progress_percentage)

    content += f"## Platform Progress\n\n"
    content += f"**{completed_tasks} / {total_tasks} Sub-tasks Completed**\n\n"
    content += f"`[{progress_bar}] {progress_percentage:.2f}%`\n\n"

    for stage_data in platform_stages:
        # Calculate progress for this stage
        stage_subtasks = []
        for task in stage_data['tasks']:
            stage_subtasks.extend(task.get('subtasks', []))

        stage_completed, stage_total, stage_progress = calculate_progress(stage_subtasks)
        stage_bar = create_progress_bar(stage_progress)

        content += f"## {stage_data['stage']}\n\n"
        content += f"**{stage_completed} / {stage_total} Sub-tasks Completed**\n\n"
        content += f"`[{stage_bar}] {stage_progress:.2f}%`\n\n"

        for task in stage_data['tasks']:
            content += f"### {task['name']} (`{task['id']}`)\n\n"

            subtasks = task.get('subtasks', [])
            if not subtasks:
                content += "_No sub-tasks defined._\n\n"
                continue

            for subtask in subtasks:
                checkbox = "- [x]" if subtask.get('status') == 'Completed' else "- [ ]"
                content += f"{checkbox} {subtask['description']}\n"

            content += "\n"
        content += "---\n\n"

    try:
        output_filename.write_text(content, encoding='utf-8')
        logger.info(f"Successfully generated {output_filename}")
    except Exception as e:
        logger.error(f"Failed to write file {output_filename}: {e}")
        raise

def generate_master_markdown(stages: List[Dict[str, Any]], output_filename: Path) -> None:
    """Generates the Master Progress Markdown file with enhanced features."""
    logger.info("Generating master progress markdown")

    content = "# Master Development Progress\n\n"
    content += f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC_\n\n"
    content += "This document provides a master view of all development tasks for the Meqenet platform. It is auto-generated from `tasks.yaml`.\n\n"

    # Collect all subtasks across all stages
    all_subtasks = []
    for stage in stages:
        for task in stage['tasks']:
            subtasks = task.get('subtasks', [])
            all_subtasks.extend(subtasks)

    completed_tasks, total_tasks, progress = calculate_progress(all_subtasks)
    progress_bar = create_progress_bar(progress)

    content += f"## Overall Progress\n\n"
    content += f"**{completed_tasks} / {total_tasks} Sub-tasks Completed**\n\n"
    content += f"`[{progress_bar}] {progress:.2f}%`\n\n"

    # Add summary by platform
    platform_stats = {}
    for stage in stages:
        for task in stage['tasks']:
            platform = task.get('platform', 'Both')
            subtasks = task.get('subtasks', [])

            if platform not in platform_stats:
                platform_stats[platform] = {'completed': 0, 'total': 0}

            platform_stats[platform]['total'] += len(subtasks)
            platform_stats[platform]['completed'] += sum(1 for st in subtasks if st.get('status') == 'Completed')

        content += "## Progress by Platform\n\n"
    for platform, stats in platform_stats.items():
        platform_progress = (stats['completed'] / stats['total']) * 100 if stats['total'] > 0 else 0
        platform_bar = create_progress_bar(platform_progress)
        platform_type = "[Mobile]" if platform == 'App' else "[Web]" if platform == 'Website' else "[Backend]"
        content += f"- {platform_type} **{platform}**: {stats['completed']}/{stats['total']} ({platform_progress:.1f}%)\n"
    content += "\n"

    for stage_data in stages:
        # Calculate progress for this stage
        stage_subtasks = []
        for task in stage_data['tasks']:
            stage_subtasks.extend(task.get('subtasks', []))

        stage_completed, stage_total, stage_progress = calculate_progress(stage_subtasks)
        stage_bar = create_progress_bar(stage_progress)

        content += f"## {stage_data['stage']}\n\n"
        content += f"**{stage_completed} / {stage_total} Sub-tasks Completed**\n\n"
        content += f"`[{stage_bar}] {stage_progress:.2f}%`\n\n"

        for task in stage_data['tasks']:
            platform_type = "[Mobile]" if task.get('platform') == 'App' else "[Web]" if task.get('platform') == 'Website' else "[Backend]"
            content += f"### {platform_type} {task['name']} (`{task['id']}`)\n\n"

            subtasks = task.get('subtasks', [])
            if not subtasks:
                content += "_No sub-tasks defined._\n\n"
            else:
                for subtask in subtasks:
                    checkbox = "- [x]" if subtask.get('status') == 'Completed' else "- [ ]"
                    content += f"{checkbox} {subtask['description']}\n"

                content += "\n"
        content += "---\n\n"

    try:
        output_filename.write_text(content, encoding='utf-8')
        logger.info(f"Successfully generated {output_filename}")
    except Exception as e:
        logger.error(f"Failed to write file {output_filename}: {e}")
        raise


def validate_stages_structure(stages: List[Dict[str, Any]]) -> bool:
    """Validate the overall structure of stages data."""
    if not stages:
        logger.error("No stages found in tasks.yaml")
        return False

    total_tasks = 0
    total_subtasks = 0

    for stage in stages:
        if 'stage' not in stage or 'tasks' not in stage:
            logger.error(f"Stage missing required fields: {stage}")
            return False

        stage_tasks = stage['tasks']
        if not isinstance(stage_tasks, list):
            logger.error(f"Stage '{stage['stage']}' tasks is not a list")
            return False

        for task in stage_tasks:
            if not validate_task_structure(task):
                return False
            total_tasks += 1
            total_subtasks += len(task.get('subtasks', []))

    logger.info(f"Validation successful: {len(stages)} stages, {total_tasks} tasks, {total_subtasks} subtasks")
    return True

def main():
    """Main function to run the script with enhanced error handling and logging."""
    try:
        logger.info("=== Meqenet Progress Report Generator Starting ===")

        script_dir = Path(__file__).parent
        logger.info(f"Script directory: {script_dir}")

        tasks_file = script_dir / 'tasks.yaml'
        logger.info(f"Looking for tasks file: {tasks_file}")

        if not tasks_file.exists():
            raise FileNotFoundError(f"Tasks file not found: {tasks_file}")

        # Load and validate YAML data
        logger.info("Loading and parsing tasks.yaml...")
        tasks_data = yaml.safe_load(tasks_file.read_text(encoding='utf-8'))

        if not isinstance(tasks_data, dict):
            raise ValueError("Invalid YAML structure: expected dictionary at root level")

        stages = tasks_data.get('stages', [])
        logger.info(f"Found {len(stages)} stages in tasks.yaml")

        # Validate structure
        if not validate_stages_structure(stages):
            raise ValueError("Invalid tasks.yaml structure")

        # Create output directory
        output_dir = script_dir
        output_dir.mkdir(exist_ok=True)
        logger.info(f"Output directory: {output_dir}")

        # Generate progress files
        logger.info("Generating App progress file...")
        generate_markdown_for_platform(stages, 'App', output_dir / 'App_Progress.md')

        logger.info("Generating Website progress file...")
        generate_markdown_for_platform(stages, 'Website', output_dir / 'Website_Progress.md')

        logger.info("Generating Master progress file...")
        generate_master_markdown(stages, output_dir / 'Master_Progress.md')

        logger.info("=== All progress files generated successfully ===")

        # Print summary
        all_subtasks = [
            subtask for stage in stages
            for task in stage['tasks']
            for subtask in task.get('subtasks', [])
        ]

        completed, total, progress = calculate_progress(all_subtasks)
        print("\n=== Progress Summary ===")
        print(f"   - Total progress: {progress:.1f}%")
        print(f"   - Completed: {completed}/{total}")
        print(f"   - Success rate: {progress:.1f}%")

        # Platform breakdown
        platform_stats = {}
        for stage in stages:
            for task in stage['tasks']:
                platform = task.get('platform', 'Both')
                subtasks = task.get('subtasks', [])

                if platform not in platform_stats:
                    platform_stats[platform] = {'completed': 0, 'total': 0}

                platform_stats[platform]['total'] += len(subtasks)
                platform_stats[platform]['completed'] += sum(1 for st in subtasks if st.get('status') == 'Completed')

        print("\n=== Platform Breakdown ===")
        for platform, stats in platform_stats.items():
            platform_progress = (stats['completed'] / stats['total']) * 100 if stats['total'] > 0 else 0
            emoji = "[Mobile]" if platform == 'App' else "[Web]" if platform == 'Website' else "[Backend]"
            print(f"   {emoji} {platform}: {stats['completed']}/{stats['total']} ({platform_progress:.1f}%)")

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(f"❌ Error: {e}")
        return 1
    except yaml.YAMLError as e:
        logger.error(f"YAML parsing error: {e}")
        print(f"❌ YAML Error: {e}")
        return 1
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        print(f"❌ Validation Error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        print(f"❌ Unexpected Error: {e}")
        return 1

    return 0

if __name__ == "__main__":
    main() 