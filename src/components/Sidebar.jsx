import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  CalendarToday,
  Phone,
  People,
  LocalHospital,
  Settings,
  NewReleases,
  AccessTime,
  Chat,
  Analytics,
  MedicalServices,
  AdminPanelSettings,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments', roles: ['Admin', 'Doctor', 'Receptionist'] },
    { text: 'Availability', icon: <AccessTime />, path: '/availability', roles: ['Admin', 'Doctor'] },
    { text: 'Call Console', icon: <Phone />, path: '/call-console', roles: ['Admin', 'Receptionist'] },
    { text: 'Call Logs', icon: <Phone />, path: '/call-logs', roles: ['Admin', 'Receptionist'] },
    { text: 'Chat', icon: <Chat />, path: '/chat', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
    { text: 'News', icon: <NewReleases />, path: '/news', roles: ['Admin', 'Doctor', 'Receptionist', 'Staff'] },
    { text: 'Ambulance', icon: <MedicalServices />, path: '/ambulance', roles: ['Admin', 'Receptionist'] },
];

const adminMenuItems = [
    { text: 'Analytics', icon: <Analytics />, path: '/analytics', roles: ['Admin'] },
    { text: 'User Management', icon: <People />, path: '/users', roles: ['Admin'] },
    { text: 'Staff Management', icon: <LocalHospital />, path: '/staff', roles: ['Admin'] },
    { text: 'Doctor Management', icon: <LocalHospital />, path: '/doctors', roles: ['Admin'] },
    { text: 'Admin Management', icon: <AdminPanelSettings />, path: '/admin-manage', roles: ['Admin'] },
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['Admin'] },
]

const NavItem = ({ item, onClose }) => {
  const theme = useTheme();
  const handleClick = () => {
    // Blur focused element before drawer closes to prevent aria-hidden warning
    document.activeElement?.blur();
    onClose();
  };
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={NavLink}
        to={item.path}
        onClick={handleClick}
        sx={{
          color: theme.palette.text.secondary,
          '&.active': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
            borderRight: `4px solid ${theme.palette.primary.main}`,
            fontWeight: 'bold',
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
          },
          margin: '4px 0',
          borderRadius: '0 20px 20px 0',
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} />
      </ListItemButton>
    </ListItem>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useAuth();

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));
  const filteredAdminMenuItems = adminMenuItems.filter(item => item.roles.includes(user?.role));

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="primary.main" fontWeight="bold">
          AI Receptionist
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, px: 2 }}>
        {filteredMenuItems.map((item) => (
          <NavItem key={item.text} item={item} onClose={onClose} />
        ))}
        {filteredAdminMenuItems.length > 0 && (
            <>
                <Typography variant="overline" sx={{ pl: 2, pt: 2, display: 'block' }}>
                    Admin
                </Typography>
                {filteredAdminMenuItems.map((item) => (
                    <NavItem key={item.text} item={item} onClose={onClose} />
                ))}
            </>
        )}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true, disableRestoreFocus: true }}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
