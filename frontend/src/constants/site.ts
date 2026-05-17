import type { ProjectCard } from '../types/blog'

export const TOKEN_KEY = 'toldyou_admin_token'

export const fixedSiteKeys = ['site_title', 'site_subtitle', 'home_intro', 'github_url', 'email']

export const defaultProjects: ProjectCard[] = [
  {
    title: 'LLM Test Case Generator',
    description: '基于大模型的测试用例辅助生成工作流系统。',
    stack: ['FastAPI', 'LangChain', 'PostgreSQL'],
    github: '#',
    demo: '#',
  },
  {
    title: 'Agent Workflow Platform',
    description: '支持多 Agent 协作、任务编排与可视化执行的平台。',
    stack: ['Python', 'FastAPI', 'PostgreSQL'],
    github: '#',
    demo: '#',
  },
  {
    title: 'Personal Blog',
    description: '基于现代前端与后端技术栈构建的个人博客网站。',
    stack: ['Vue', 'FastAPI', 'PostgreSQL'],
    github: '#',
    demo: '#',
  },
]
