import { createContext, useContext, useEffect, useState, type ReactNode, type SetStateAction } from "react";

import api from "../utils/api";
import { useAuth } from "./AuthContext";

export interface Project {
    _id: string;
    owner: string;
    name: string;
    description?: string;
    starred: boolean;
    lastOpenedAt: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectResponse {
    success: boolean;
    data?: Project[];
    message?: string;
}

interface CreateProjectInput {
    name: string;
    description?: string;
}

interface GenericResponse {
    success: boolean;
    message?: string;
    data?: Project;
}

interface ProjectContextValue {
    projects: Project[];
    starredProjects: Project[];
    loading: boolean;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setStarredProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    refreshProjects: () => Promise<void>;
    addNewProject: (project: CreateProjectInput) => Promise<Project | null>;
    fetchStarredProjects: () => Promise<void>;
    handleToggleStar: (projectId: string) => Promise<void>;
    handleDeleteProject: (projectId: string) => Promise<void>;
    currentProject: Project | null;
    setCurrentProject: React.Dispatch<SetStateAction<Project | null>>;
}

interface ProjectProviderProps {
    children: ReactNode;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider = ({
    children,
}: ProjectProviderProps) => {
    const { user, loading: authLoading } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [starredProjects, setStarredProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refreshProjects = async (): Promise<void> => {
        if (!user) {
            setProjects([]);
            return;
        }

        try {
            const { data } = await api.get<ProjectResponse>(
                "/api/projects",
            );

            if (data.success && data.data) {
                setProjects(data.data);
            } else {
                setProjects([]);
            }
        } catch (error: unknown) {
            console.log("Projects fetch error:", error);
            setProjects([]);
        }
    };

    const addNewProject = async (
        project: CreateProjectInput,
    ): Promise<Project | null> => {
        try {
            const { data } = await api.post<GenericResponse>("/api/projects", project);

            if (data.success && data.data) {
                setProjects((currentProjects) => [
                    data.data!,
                    ...currentProjects,
                ]);

                return data.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Create project error:", error);
            return null;
        }
    };

    const fetchStarredProjects = async (): Promise<void> => {
        try {
            const { data } = await api.get<ProjectResponse>(
                "/api/projects/starred",
            );

            if (data.success && data.data) {
                setStarredProjects(data.data);
            } else {
                setStarredProjects([]);
            }
        } catch (error: unknown) {
            console.log("Starred projects fetch error:", error);
            setStarredProjects([]);
        }
    };

    const handleToggleStar = async (projectId: string): Promise<void> => {
        try {
            const { data } = await api.patch<GenericResponse>(`/api/projects/${projectId}`);

            if (!data.success || !data.data) return;

            const updatedProject = data.data;

            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project._id === projectId ? updatedProject : project
                )
            );

            setStarredProjects((currentProjects) => {
                if (updatedProject.starred) {
                    const existingProject = currentProjects.find(
                        (project) => project._id === projectId
                    );

                    return existingProject
                        ? currentProjects.map((project) =>
                            project._id === projectId ? updatedProject : project
                        )
                        : [updatedProject, ...currentProjects];
                }

                return currentProjects.filter((project) => project._id !== projectId);
            });
        } catch (error: unknown) {
            console.log("Toggle star error:", error);
        }
    };

    const handleDeleteProject = async (projectId: string): Promise<void> => {
        try {
            const { data } = await api.delete<GenericResponse>(`/api/projects/${projectId}`);

            if (!data.success) return;

            setProjects((currentProjects) =>
                currentProjects.filter((project) => project._id !== projectId)
            );

            setStarredProjects((currentProjects) =>
                currentProjects.filter((project) => project._id !== projectId)
            );
        } catch (error: unknown) {
            console.log("Delete project error:", error);
        }
    };

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setProjects([]);
            setStarredProjects([]);
            setLoading(false);
            return;
        }

        const loadProjects = async (): Promise<void> => {
            setLoading(true);

            try {
                await Promise.all([
                    refreshProjects(),
                    fetchStarredProjects(),
                ]);
            } finally {
                setLoading(false);
            }
        };

        void loadProjects();
    }, [user, authLoading]);

    return (
        <ProjectContext.Provider
            value={{
                projects,
                loading,
                setProjects,
                refreshProjects,
                addNewProject,
                fetchStarredProjects,
                starredProjects,
                setStarredProjects,
                handleToggleStar,
                handleDeleteProject,
                currentProject,
                setCurrentProject,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = (): ProjectContextValue => {
    const context = useContext(ProjectContext);

    if (!context) {
        throw new Error(
            "useProjects must be used inside a ProjectProvider",
        );
    }

    return context;
};
