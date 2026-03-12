import { supabase } from './supabase-auth.js';

/**
 * Load the appropriate navigation based on user role
 * @param {string} containerId - The ID of the container where nav will be injected
 * @returns {Promise<void>}
 */
export async function loadNavigation(containerId = 'nav-container') {
  try {
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      console.log('No user found, skipping navigation load');
      return;
    }

    console.log('Loading navigation for user:', user.id);

    // Check the user_profiles table for the role
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let userRole = 'student'; // default to student

    if (!profileError && profileData) {
      userRole = profileData.role || 'student';
      console.log('User role from profile:', userRole);
    } else {
      console.log('No profile found or error fetching profile, defaulting to student');
    }

    // Load navigation based on role
    if (userRole === 'instructor') {
      console.log('Loading instructor navigation');
      await loadInstructorNavigation(containerId);
    } else {
      console.log('Loading student navigation');
      await loadStudentNavigation(containerId);
    }
    setupMobileMenuToggle();
  } catch (err) {
    console.error('Error loading navigation:', err);
    // Default to student nav on error
    await loadStudentNavigation(containerId);
    setupMobileMenuToggle();
  }
}

/**
 * Setup mobile menu toggle functionality
 */
function setupMobileMenuToggle() {
  // Find ALL hamburger buttons (both desktop and mobile headers may have them)
  const sidebarToggles = document.querySelectorAll('[id="sidebarToggle"]');
  const globalSidebar = document.getElementById('globalSidebar');
  const navBackdrop = document.getElementById('navBackdrop');

  if (sidebarToggles.length > 0 && globalSidebar) {
    // Toggle sidebar on hamburger click
    const toggleSidebar = () => {
      globalSidebar.classList.toggle('active');
      navBackdrop?.classList.toggle('active');
    };

    // Attach listener to ALL hamburger buttons
    sidebarToggles.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
      });
    });

    // Close sidebar when backdrop is clicked
    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => {
        globalSidebar.classList.remove('active');
        navBackdrop.classList.remove('active');
      });
    }

    // Close sidebar when a nav link is clicked
    const navLinks = globalSidebar.querySelectorAll('a, button');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        globalSidebar.classList.remove('active');
        navBackdrop?.classList.remove('active');
      });
    });
  }

  // Setup profile menu toggles (always, not conditionally)
  setupProfileMenuToggle();
}

/**
 * Setup profile menu toggles for both desktop and mobile
 */
function setupProfileMenuToggle() {
  // Desktop profile menu
  const desktopProfileBtn = document.getElementById('profileBtn');
  const desktopProfileDropdown = document.getElementById('profileDropdown');

  if (desktopProfileBtn && desktopProfileDropdown) {
    desktopProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = desktopProfileDropdown.hasAttribute('hidden');
      if (isHidden) {
        desktopProfileDropdown.removeAttribute('hidden');
      } else {
        desktopProfileDropdown.setAttribute('hidden', '');
      }
      // Close mobile profile if open
      const mobileDropdown = document.getElementById('profileDropdownMobile');
      if (mobileDropdown) mobileDropdown.setAttribute('hidden', '');
    });
  }

  // Mobile profile menu
  const mobileProfileBtn = document.getElementById('profileBtnMobile');
  const mobileProfileDropdown = document.getElementById('profileDropdownMobile');

  if (mobileProfileBtn && mobileProfileDropdown) {
    mobileProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = mobileProfileDropdown.hasAttribute('hidden');
      if (isHidden) {
        mobileProfileDropdown.removeAttribute('hidden');
      } else {
        mobileProfileDropdown.setAttribute('hidden', '');
      }
      // Close desktop profile if open
      const desktopDropdown = document.getElementById('profileDropdown');
      if (desktopDropdown) desktopDropdown.setAttribute('hidden', '');
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const desktopBtn = document.getElementById('profileBtn');
    const mobileBtn = document.getElementById('profileBtnMobile');
    const desktopDropdown = document.getElementById('profileDropdown');
    const mobileDropdown = document.getElementById('profileDropdownMobile');
    
    // Close desktop dropdown if click is outside
    if (desktopBtn && desktopDropdown && e.target !== desktopBtn && !desktopBtn.contains(e.target) && !desktopDropdown.contains(e.target)) {
      desktopDropdown.setAttribute('hidden', '');
    }
    
    // Close mobile dropdown if click is outside
    if (mobileBtn && mobileDropdown && e.target !== mobileBtn && !mobileBtn.contains(e.target) && !mobileDropdown.contains(e.target)) {
      mobileDropdown.setAttribute('hidden', '');
    }
  });
}
export function clearUserRole() {
  // Clear ALL sessionStorage to ensure clean state on logout
  sessionStorage.clear();
}

/**
 * Load student navigation
 * @returns {Promise<void>}
 */
function loadStudentNavigation(containerId) {
  return fetch('/TEMPLATES/FrameNavigation.html')
    .then(r => r.text())
    .then(html => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        document.body.classList.add('has-global-sidebar');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.classList.add('with-global-sidebar');
        
        // Populate user profile sections
        populateUserProfile();
      }
    })
    .catch(err => console.error('Error loading student navigation:', err));
}

/**
 * Populate user profile in navigation
 * @returns {Promise<void>}
 */
async function populateUserProfile() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) return;

    const email = (user.email || '').toLowerCase();
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url, role')
      .eq('user_email', email)
      .single();

    if (!profileError && profileData) {
      const fullName = profileData.full_name || 'User';
      const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23FF6B35%22/%3E%3Ctext x=%2250%22 y=%2255%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22 font-weight=%22bold%22%3E' + fullName.charAt(0).toUpperCase() + '%3C/text%3E%3C/svg%3E';
      const avatarUrl = profileData.avatar_url || defaultAvatar;
      const role = profileData.role || 'student';

      // Update header profile (desktop)
      const headerName = document.getElementById('headerProfileName');
      const headerAvatar = document.getElementById('headerProfileAvatar');
      if (headerName) headerName.textContent = fullName;
      if (headerAvatar) headerAvatar.src = avatarUrl;

      // Update mobile header profile
      const headerAvatarMobile = document.getElementById('headerProfileAvatarMobile');
      if (headerAvatarMobile) headerAvatarMobile.src = avatarUrl;

      // Update sidebar profile
      const sidebarName = document.getElementById('sidebarProfileName');
      const sidebarAvatar = document.getElementById('sidebarProfileAvatar');
      const sidebarRole = document.getElementById('sidebarProfileRole');
      if (sidebarName) sidebarName.textContent = fullName;
      if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
      if (sidebarRole) sidebarRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
  } catch (err) {
    console.error('Error populating user profile:', err);
  }
}

/**
 * Load instructor navigation
 * @returns {Promise<void>}
 */
function loadInstructorNavigation(containerId) {
  return fetch('/TEMPLATES/FrameNavigationInstructor.html')
    .then(r => r.text())
    .then(html => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        document.body.classList.add('has-global-sidebar');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.classList.add('with-global-sidebar');
        
        // Populate user profile sections
        populateUserProfile();
      }
    })
    .catch(err => console.error('Error loading instructor navigation:', err));
}

/**
 * Set up logout button functionality
 * Must be called AFTER navigation HTML is injected into DOM
 */
export function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  const signOutLink = document.getElementById('signOut');
  const signOutLinkMobile = document.getElementById('signOutMobile');

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    try {
      await supabase.auth.signOut();
      clearUserRole();
      window.location.href = '/TEMPLATES/FrameLogin.html';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (signOutLink) {
    signOutLink.addEventListener('click', handleLogout);
  }

  if (signOutLinkMobile) {
    signOutLinkMobile.addEventListener('click', handleLogout);
  }
}
