"use client";
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import ReactFlow, { Node, Edge, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

type TodoWithDeps = Todo & { dependencyIds: number[] };

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [todos, setTodos] = useState<TodoWithDeps[]>([]);
  const [selectedDeps, setSelectedDeps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
  }

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo,
          dueDate: newDueDate || null,
          dependencyIds: selectedDeps,
        }),
      });
      setNewTodo('');
      setNewDueDate('');
      setSelectedDeps([]);
      fetchTodos();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Dependency checkbox handler
  const toggleDependency = (id: number) => {
    setSelectedDeps((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  };

  // Calculate earliest start date based on dependencies
  function getEarliestStartDate(todo: TodoWithDeps, memo = new Map<number, Date>()): Date {
    if (memo.has(todo.id)) return memo.get(todo.id)!;
    if (todo.dependencyIds.length === 0) {
      const d = todo.dueDate ? new Date(todo.dueDate) : new Date();
      memo.set(todo.id, d);
      return d;
    }

    const depDates = todo.dependencyIds.map((depId) => {
      const dep = todos.find((t) => t.id === depId);
      if (!dep) return new Date();
      return getEarliestStartDate(dep, memo);
    });

    const maxDate = new Date(Math.max(...depDates.map((d) => d.getTime())));
    memo.set(todo.id, maxDate);
    return maxDate;
  }

    // Build React Flow graph nodes and edges
    const nodes: Node[] = todos.map((todo, idx) => ({
    id: todo.id.toString(),
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 150 },
    data: {
      label: (
        <div style={{ width: 100 }}>
          <strong>{todo.title}</strong>
          
          <div>
            Due: {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'N/A'}
            <br />
            Earliest Start: {getEarliestStartDate(todo).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    style: {
      border: '1px solid #ddd',
      padding: 10,
      borderRadius: 8,
      backgroundColor:
        todo.dueDate && new Date(todo.dueDate) < new Date() ? '#fee2e2' : 'white',
    },
  }));

  const edges: Edge[] = [];
  todos.forEach((todo) => {
    todo.dependencyIds.forEach((depId) => {
      edges.push({
        id: `e${depId}-${todo.id}`,
        source: depId.toString(),
        target: todo.id.toString(),
        animated: true,
        style: { stroke: '#888' },
        markerEnd: {
          type: 'arrowclosed',
        },
      });
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Things To Do App</h1>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="New todo title"
            className="flex-grow p-3 rounded border"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            disabled={loading}
          />
          <input
            type="date"
            className="p-3 rounded border"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAddTodo}
            className="bg-indigo-600 text-white px-4 py-3 rounded hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            Add
          </button>
        </div>

        <div className="mb-6">
          <strong>Select Dependencies:</strong>
          <div className="flex flex-wrap gap-4 mt-2 max-h-40 overflow-auto border p-2 rounded">
            {todos.map((todo) => (
              <label key={todo.id} className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedDeps.includes(todo.id)}
                  onChange={() => toggleDependency(todo.id)}
                  disabled={loading}
                />
                {todo.title}
              </label>
            ))}
          </div>
        </div>

        <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="mb-4 p-4 bg-gray-100 rounded shadow flex justify-between items-center"
          >
            <div className="flex-grow">
              <h2 className="font-semibold">{todo.title}</h2>
              <p>
                Due:{' '}
                <span
                  className={
                    todo.dueDate && new Date(todo.dueDate) < new Date()
                      ? 'text-red-600'
                      : ''
                  }
                >
                  {todo.dueDate
                    ? new Date(todo.dueDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </p>
              <p>Depends on: {todo.dependencyIds.length ? todo.dependencyIds.join(', ') : 'None'}</p>
              <p>
                Earliest start:{' '}
                {getEarliestStartDate(todo).toLocaleDateString()}
              </p>
            </div>

            {todo.imageUrl && (
              <img
                src={todo.imageUrl}
                alt={todo.title}
                className="w-24 h-24 object-cover rounded ml-4"
                loading="lazy"
              />
            )}

            <button
              onClick={() => {
                fetch(`/api/todos/${todo.id}`, { method: 'DELETE' }).then(() =>
                  fetchTodos()
                );
              }}
              className="text-red-600 hover:text-red-800 ml-4"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

        <h3 className="mt-10 mb-4 text-xl font-bold text-center">
          Task Dependency Graph
        </h3>
        <div style={{ height: 500, backgroundColor: '#f9fafb' }}>
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
