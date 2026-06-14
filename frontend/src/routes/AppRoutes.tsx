import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedLayout } from '../layouts/ProtectedLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { CoursesPage } from '../pages/CoursesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ExplorePage } from '../pages/ExplorePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { SubjectsPage } from '../pages/SubjectsPage';
import { ProtectedRoute } from './ProtectedRoute';

const AppRoutes = () => {
	return (
		<Routes>
			<Route element={<PublicLayout />}>
				<Route index element={<Navigate to="/login" replace />} />
				<Route path="login" element={<LoginPage />} />
				<Route path="register" element={<RegisterPage />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<ProtectedLayout />}>
					<Route path="home" element={<DashboardPage />} />
					<Route path="explore" element={<ExplorePage />} />
					<Route path="courses" element={<CoursesPage />} />
					<Route path="subjects" element={<SubjectsPage />} />
					<Route path="profile" element={<ProfilePage />} />
					<Route path="profile/:studentId" element={<ProfilePage />} />
					<Route path="posts/:postId" element={<PostDetailPage />} />
					<Route path="search" element={<SearchResultsPage />} />
					<Route path="dashboard" element={<Navigate to="/home" replace />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export { AppRoutes };
