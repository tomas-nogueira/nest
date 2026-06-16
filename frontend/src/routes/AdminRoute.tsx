import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = () => {
	const { user } = useAuth();

	if (user?.role !== 'admin') {
		return <Navigate to="/home" replace />;
	}

	return <Outlet />;
};

export { AdminRoute };
