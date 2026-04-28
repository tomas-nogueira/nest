import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedLayout } from '../layouts/ProtectedLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';

const AppRoutes = () => {
	return (
		<Routes>
			<Route element={<PublicLayout />}>
				<Route index element={<HomePage />} />
				<Route path="login" element={<LoginPage />} />
				<Route path="register" element={<RegisterPage />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<ProtectedLayout />}>
					<Route path="dashboard" element={<DashboardPage />} />
				</Route>
			</Route>

			<Route path="/home" element={<Navigate to="/" replace />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export { AppRoutes };
