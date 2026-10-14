(function (root, factory) {
  const taskUtils = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = taskUtils;
  } else {
    root.PetalTaskUtils = taskUtils;
  }
})(globalThis, function () {
  function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function filterTasks(tasks, filter, search, today) {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter(task => {
      if (filter === 'today' && task.dueDate !== today) return false;
      if (filter === 'upcoming' && !(isValidDate(task.dueDate) && task.dueDate > today && !task.completed)) return false;
      if (filter === 'overdue' && !(isValidDate(task.dueDate) && task.dueDate < today && !task.completed)) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (filter === 'active' && task.completed) return false;
      return !query || task.text.toLocaleLowerCase().includes(query);
    });
  }

  function sortTasks(tasks, sortBy) {
    const result = tasks.slice();
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    result.sort((left, right) => {
      if (sortBy === 'priority') {
        return (priorityRank[left.priority] ?? 3) - (priorityRank[right.priority] ?? 3)
          || (right.createdAt || '').localeCompare(left.createdAt || '');
      }
      if (sortBy === 'created') {
        return (right.createdAt || '').localeCompare(left.createdAt || '');
      }
      if (sortBy === 'alphabetical') {
        return left.text.localeCompare(right.text);
      }
      const leftDue = isValidDate(left.dueDate) ? left.dueDate : '9999-12-31';
      const rightDue = isValidDate(right.dueDate) ? right.dueDate : '9999-12-31';
      return leftDue.localeCompare(rightDue) || (right.createdAt || '').localeCompare(left.createdAt || '');
    });
    return result;
  }

  return { filterTasks, sortTasks, isValidDate };
});
