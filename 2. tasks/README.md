# Task Management and Progress Tracking

This directory contains the tools for managing and tracking the development progress of the Meqenet
2.0 platform.

## The System

The tracking system is designed around a "single source of truth" philosophy to ensure consistency
and simplify updates.

1.  **`tasks.yaml`**: This is the central file where all development tasks are defined. It contains
    the task ID, title, description, platform (`App`, `Website`, or `Both`), status, and a list of
    context files from the `docs` directory that are relevant to the task. **This is the only file
    you should ever edit manually.**

2.  **`update_progress.py`**: This Python script reads `tasks.yaml` and automatically generates the
    three markdown progress files. It ensures that all views are perfectly synchronized with the
    master task list.

3.  **Progress Files (`*.md`)**: These files are auto-generated and should **never be edited
    directly**.
    - `Master_Progress.md`: A complete overview of all tasks for all platforms, including a progress
      bar.
    - `App_Progress.md`: Contains only the tasks relevant to the mobile app (`App` or `Both`).
    - `Website_Progress.md`: Contains only the tasks relevant to the web platforms (`Website` or
      `Both`).

## How to Use

### To Update a Task's Status

1.  Open `tasks/tasks.yaml`.
2.  Find the task you want to update by its `id`.
3.  Change the `status` field from `"To Do"` to `"Done"`.
4.  Save the file.

### To Regenerate the Progress Files

1.  Run the update script from the **root of the project directory**:

````bash
    python tasks/update_progress.py
    ```
2.  Commit the changes to `tasks.yaml` and the updated `*.md` files to Git.

This system ensures that our progress tracking is robust, easy to maintain, and provides clear, context-rich information for both human developers and the AI coding assistant.
````
