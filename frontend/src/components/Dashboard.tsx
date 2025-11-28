import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * Project management dashboard component with analytics, stats, and activity feed.
 *
 * @returns {JSX.Element} Dashboard component.
 */
const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Project 1', status: 'In Progress' },
    { id: 2, name: 'Project 2', status: 'Completed' },
    { id: 3, name: 'Project 3', status: 'Pending' },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, projectName: 'Project 1', action: 'Updated', timestamp: new Date('2024-01-01T12:00:00') },
    { id: 2, projectName: 'Project 2', action: 'Created', timestamp: new Date('2024-01-05T14:00:00') },
    { id: 3, projectName: 'Project 3', action: 'Deleted', timestamp: new Date('2024-01-10T16:00:00') },
  ]);

  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
  });

  useEffect(() => {
    setStats({
      totalProjects: projects.length,
      completedProjects: projects.filter((project) => project.status === 'Completed').length,
      pendingProjects: projects.filter((project) => project.status === 'Pending').length,
    });
  }, [projects]);

  return (
    <div className="h-screen p-4 md:p-6 lg:p-8 flex flex-col">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">Total Projects</h2>
          <p className="text-2xl font-bold">{stats.totalProjects}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">Completed Projects</h2>
          <p className="text-2xl font-bold">{stats.completedProjects}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">Pending Projects</h2>
          <p className="text-2xl font-bold">{stats.pendingProjects}</p>
        </div>
      </div>
      <h2 className="text-lg font-bold mb-4">Activity Feed</h2>
      <div className="bg-white p-4 rounded shadow">
        <ul>
          {activities.map((activity) => (
            <li key={activity.id} className="py-2 border-b border-gray-200">
              <Link to={`/projects/${activity.projectName}`} className="text-blue-600 hover:text-blue-800">
                {activity.projectName}
              </Link>
              <span className="text-gray-600 ml-2">{activity.action}</span>
              <span className="text-gray-600 ml-2">{format(activity.timestamp, 'MMMM dd, yyyy hh:mm a')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;