import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;

async function fetchImageUrl(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    const data = await res.json();
    return data.photos?.[0]?.src?.medium ?? null;
  } catch (err) {
    console.error('Failed to fetch image from Pexels:', err);
    return null;
  }
}

// Helper: check for circular dependencies using DFS
async function hasCircularDependency(
  newTaskId: number,
  dependencyIds: number[]
): Promise<boolean> {
  const visited = new Set<number>();

  async function dfs(taskId: number): Promise<boolean> {
    if (visited.has(taskId)) return true; // cycle detected
    visited.add(taskId);

    // get dependencies of this task
    const deps = await prisma.taskDependency.findMany({
      where: { taskId },
      select: { dependsOnId: true },
    });

    for (const dep of deps) {
      if (dep.dependsOnId === newTaskId) return true; // cycle back to new task
      if (await dfs(dep.dependsOnId)) return true;
    }

    visited.delete(taskId);
    return false;
  }

  for (const depId of dependencyIds) {
    if (await dfs(depId)) return true;
  }
  return false;
}

export async function GET() {
  try {
    // fetch todos with their dependencies
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        dependencies: {
          include: {
            dependsOn: true,
          },
        },
      },
    });

    // format dependencies as array of task IDs for each todo
    const formattedTodos = todos.map((todo) => ({
      ...todo,
      dependencyIds: todo.dependencies.map((d) => d.dependsOnId),
    }));

    return NextResponse.json(formattedTodos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds = [] } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Temporarily create the task without dependencies to get its ID
    const tempTodo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl: await fetchImageUrl(title),
      },
    });

    // Check for circular dependencies before adding dependencies
    if (dependencyIds.length > 0) {
      const hasCycle = await hasCircularDependency(tempTodo.id, dependencyIds);
      if (hasCycle) {
        // Delete the temp task to keep DB clean
        await prisma.todo.delete({ where: { id: tempTodo.id } });
        return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
      }

      // Add dependencies in the join table
      await prisma.taskDependency.createMany({
        data: dependencyIds.map((depId: number) => ({
          taskId: tempTodo.id,
          dependsOnId: depId,
        })),
      });
    }

    // Refetch task with dependencies included
    const todo = await prisma.todo.findUnique({
      where: { id: tempTodo.id },
      include: {
        dependencies: {
          include: {
            dependsOn: true,
          },
        },
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await prisma.todo.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
  }
}
