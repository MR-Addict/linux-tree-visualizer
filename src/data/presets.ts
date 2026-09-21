import { TreeNode } from '../types';

export interface TreePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  data: TreeNode;
}

export const PRESETS: TreePreset[] = [
  {
    id: 'vite-react',
    name: 'Vite + React (TypeScript)',
    description: 'Modern frontend application with components, hooks, assets & configs',
    category: 'Frontend',
    data: {
      id: 'root',
      name: 'react-dashboard',
      type: 'directory',
      children: [
        {
          id: 'n-1',
          name: 'src',
          type: 'directory',
          children: [
            {
              id: 'n-1-1',
              name: 'components',
              type: 'directory',
              children: [
                { id: 'n-1-1-1', name: 'Navbar.tsx', type: 'file', size: 2450 },
                { id: 'n-1-1-2', name: 'Sidebar.tsx', type: 'file', size: 3120 },
                { id: 'n-1-1-3', name: 'MetricCard.tsx', type: 'file', size: 1890 },
                { id: 'n-1-1-4', name: 'ChartWidget.tsx', type: 'file', size: 4210 },
              ],
            },
            {
              id: 'n-1-2',
              name: 'hooks',
              type: 'directory',
              children: [
                { id: 'n-1-2-1', name: 'useAuth.ts', type: 'file', size: 1240 },
                { id: 'n-1-2-2', name: 'useDebounce.ts', type: 'file', size: 680 },
              ],
            },
            {
              id: 'n-1-3',
              name: 'assets',
              type: 'directory',
              children: [
                { id: 'n-1-3-1', name: 'logo.svg', type: 'file', size: 1540 },
                { id: 'n-1-3-2', name: 'hero-banner.png', type: 'file', size: 124500 },
              ],
            },
            { id: 'n-1-4', name: 'App.tsx', type: 'file', size: 2180 },
            { id: 'n-1-5', name: 'main.tsx', type: 'file', size: 540 },
            { id: 'n-1-6', name: 'index.css', type: 'file', size: 1890 },
            { id: 'n-1-7', name: 'types.ts', type: 'file', size: 950 },
          ],
        },
        {
          id: 'n-2',
          name: 'public',
          type: 'directory',
          children: [
            { id: 'n-2-1', name: 'favicon.ico', type: 'file', size: 15086 },
            { id: 'n-2-2', name: 'manifest.json', type: 'file', size: 420 },
          ],
        },
        { id: 'n-3', name: 'package.json', type: 'file', size: 1240 },
        { id: 'n-4', name: 'tsconfig.json', type: 'file', size: 620 },
        { id: 'n-5', name: 'vite.config.ts', type: 'file', size: 480 },
        { id: 'n-6', name: 'vite-env.d.ts', type: 'file', size: 310 },
        { id: 'n-7', name: 'README.md', type: 'file', size: 3420 },
      ],
    },
  },
  {
    id: 'fastapi-backend',
    name: 'FastAPI + SQLAlchemy',
    description: 'Python asynchronous backend service structure with migrations & routers',
    category: 'Backend',
    data: {
      id: 'root-py',
      name: 'api-service',
      type: 'directory',
      children: [
        {
          id: 'py-1',
          name: 'app',
          type: 'directory',
          children: [
            {
              id: 'py-1-1',
              name: 'api',
              type: 'directory',
              children: [
                { id: 'py-1-1-1', name: 'v1_endpoints.py', type: 'file', size: 4500 },
                { id: 'py-1-1-2', name: 'auth.py', type: 'file', size: 3100 },
                { id: 'py-1-1-3', name: 'users.py', type: 'file', size: 2800 },
              ],
            },
            {
              id: 'py-1-2',
              name: 'core',
              type: 'directory',
              children: [
                { id: 'py-1-2-1', name: 'config.py', type: 'file', size: 1800 },
                { id: 'py-1-2-2', name: 'security.py', type: 'file', size: 2400 },
              ],
            },
            {
              id: 'py-1-3',
              name: 'models',
              type: 'directory',
              children: [
                { id: 'py-1-3-1', name: 'user.py', type: 'file', size: 1500 },
                { id: 'py-1-3-2', name: 'order.py', type: 'file', size: 2100 },
              ],
            },
            { id: 'py-1-4', name: 'main.py', type: 'file', size: 1650 },
          ],
        },
        {
          id: 'py-2',
          name: 'alembic',
          type: 'directory',
          children: [
            { id: 'py-2-1', name: 'env.py', type: 'file', size: 2100 },
            {
              id: 'py-2-2',
              name: 'versions',
              type: 'directory',
              children: [
                { id: 'py-2-2-1', name: '001_initial_schema.py', type: 'file', size: 3400 },
              ],
            },
          ],
        },
        { id: 'py-3', name: 'Dockerfile', type: 'file', size: 850 },
        { id: 'py-4', name: 'docker-compose.yml', type: 'file', size: 1200 },
        { id: 'py-5', name: 'pyproject.toml', type: 'file', size: 950 },
        { id: 'py-6', name: 'requirements.txt', type: 'file', size: 640 },
        { id: 'py-7', name: 'README.md', type: 'file', size: 2400 },
      ],
    },
  },
  {
    id: 'linux-system',
    name: 'Linux Filesystem Hierarchy',
    description: 'Standard Linux / FHS directory structure (/etc, /var, /usr, /home)',
    category: 'System',
    data: {
      id: 'root-linux',
      name: '/',
      type: 'directory',
      children: [
        {
          id: 'lx-1',
          name: 'bin',
          type: 'directory',
          children: [
            { id: 'lx-1-1', name: 'bash', type: 'file', size: 1183448 },
            { id: 'lx-1-2', name: 'ls', type: 'file', size: 142144 },
            { id: 'lx-1-3', name: 'tree', type: 'file', size: 78560 },
            { id: 'lx-1-4', name: 'cat', type: 'file', size: 43696 },
          ],
        },
        {
          id: 'lx-2',
          name: 'etc',
          type: 'directory',
          children: [
            {
              id: 'lx-2-1',
              name: 'nginx',
              type: 'directory',
              children: [
                { id: 'lx-2-1-1', name: 'nginx.conf', type: 'file', size: 2450 },
                {
                  id: 'lx-2-1-2',
                  name: 'sites-available',
                  type: 'directory',
                  children: [
                    { id: 'lx-2-1-2-1', name: 'default', type: 'file', size: 1840 },
                  ],
                },
              ],
            },
            {
              id: 'lx-2-2',
              name: 'ssh',
              type: 'directory',
              children: [
                { id: 'lx-2-2-1', name: 'sshd_config', type: 'file', size: 3260 },
              ],
            },
            { id: 'lx-2-3', name: 'hosts', type: 'file', size: 220 },
            { id: 'lx-2-4', name: 'passwd', type: 'file', size: 1840 },
            { id: 'lx-2-5', name: 'fstab', type: 'file', size: 540 },
          ],
        },
        {
          id: 'lx-3',
          name: 'home',
          type: 'directory',
          children: [
            {
              id: 'lx-3-1',
              name: 'developer',
              type: 'directory',
              children: [
                { id: 'lx-3-1-1', name: '.bashrc', type: 'file', size: 3771 },
                { id: 'lx-3-1-2', name: '.gitconfig', type: 'file', size: 340 },
                {
                  id: 'lx-3-1-3',
                  name: 'projects',
                  type: 'directory',
                  children: [
                    { id: 'lx-3-1-3-1', name: 'workspace', type: 'directory', children: [] },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'lx-4',
          name: 'var',
          type: 'directory',
          children: [
            {
              id: 'lx-4-1',
              name: 'log',
              type: 'directory',
              children: [
                { id: 'lx-4-1-1', name: 'syslog', type: 'file', size: 1048576 },
                { id: 'lx-4-1-2', name: 'nginx.access.log', type: 'file', size: 5242880 },
              ],
            },
          ],
        },
      ],
    },
  },
];
