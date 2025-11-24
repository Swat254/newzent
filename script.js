// Supabase Configuration
const SUPABASE_URL = 'https://lqugtfzuffmtxoiljogs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdWd0Znp1ZmZtdHhvaWxqb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NjIwNzQsImV4cCI6MjA3OTUzODA3NH0.4_rIKGhmnJp_NlXhBYXBA4079Ewz7qZ1D4zAxfNS_eU';

// PayStack Configuration - Updated with your new keys
const PAYSTACK_PUBLIC_KEY = 'pk_live_eebdb66d551add6207fa378960dc13d2e7a0e11f';
const PAYSTACK_SECRET_KEY = 'sk_live_7ac7ba67c118498a7efa9b09e2024c11ca87baa0';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let currentUser = null;
let userProfile = null;
let userBalance = 0;
let transactions = [];
let investments = [];
let referrals = [];
let assets = [
    {
        id: '1',
        name: 'Gold Investment',
        symbol: 'GOLD',
        description: 'Invest in physical gold with secure storage',
        current_apy: 12.5,
        min_deposit: 15000,
        is_active: true
    },
    {
        id: '2',
        name: 'Bitcoin',
        symbol: 'BTC',
        description: 'Cryptocurrency investment with high growth potential',
        current_apy: 18.2,
        min_deposit: 500,
        is_active: true
    },
    {
        id: '3',
        name: 'USDT Savings',
        symbol: 'USDT',
        description: 'Stablecoin investment with consistent returns',
        current_apy: 8.5,
        min_deposit: 100,
        is_active: true
    },
    {
        id: '4',
        name: 'Coal Mining',
        symbol: 'COAL',
        description: 'Investment in coal mining operations',
        current_apy: 15.7,
        min_deposit: 20000,
        is_active: true
    },
    {
        id: '5',
        name: 'GENZ Portfolio',
        symbol: 'GENZ',
        description: 'Curated portfolio for the next generation',
        current_apy: 8.0,
        min_deposit: 200,
        is_active: true
    }
];

// DOM Elements
const authScreens = document.getElementById('auth-screens');
const app = document.getElementById('app');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const forgotPasswordScreen = document.getElementById('forgot-password-screen');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthStatus();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Authentication events
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterScreen();
    });
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        showLoginScreen();
    });
    document.getElementById('show-forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        showForgotPasswordScreen();
    });
    document.getElementById('show-login-from-forgot').addEventListener('click', function(e) {
        e.preventDefault();
        showLoginScreen();
    });
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);

    // Navigation events
    document.getElementById('deposit-btn').addEventListener('click', showDepositScreen);
    document.getElementById('withdraw-btn').addEventListener('click', showWithdrawalScreen);
    document.getElementById('earn-btn').addEventListener('click', showEarnScreen);
    document.getElementById('account-btn').addEventListener('click', showAccountScreen);
    document.getElementById('profile-item').addEventListener('click', showProfileScreen);
    document.getElementById('kyc-item').addEventListener('click', showKycScreen);
    document.getElementById('download-app-item').addEventListener('click', function() {
        window.open('https://median.co/share/mbbbjnj#apk', '_blank');
    });
    document.getElementById('support-item').addEventListener('click', showSupportScreen);
    document.getElementById('logout-item').addEventListener('click', handleLogout);
    document.getElementById('faq-option').addEventListener('click', showFaqScreen);

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            showScreen(screenId);
            
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Form submissions
    document.getElementById('deposit-form').addEventListener('submit', handleDeposit);
    document.getElementById('withdrawal-form').addEventListener('submit', handleWithdrawal);
    document.getElementById('kyc-form').addEventListener('submit', handleKycSubmission);
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('copy-referral').addEventListener('click', copyReferralCode);

    // FAQ events
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('active');
        });
    });
}

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            showAuth();
            return;
        }
        
        if (session && session.user) {
            console.log('User authenticated:', session.user.id);
            currentUser = session.user;
            await loadUserData();
            showApp();
        } else {
            console.log('No active session found');
            showAuth();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuth();
    }
}

// Load user data from Supabase - FIXED VERSION
async function loadUserData() {
    if (!currentUser) {
        console.error('No current user found');
        return;
    }
    
    console.log('Loading user data for:', currentUser.id);
    
    try {
        // Load user profile with better error handling
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (profileError) {
            console.error('Profile load error:', profileError);
            
            // If profile doesn't exist, create one
            if (profileError.code === 'PGRST116') {
                console.log('Creating new profile for user...');
                await createUserProfile();
                // Reload profile after creation
                await loadUserData();
                return;
            } else {
                showNotification('Error loading profile data', 'error');
                return;
            }
        }
        
        if (profile) {
            console.log('Profile loaded:', profile);
            userProfile = profile;
            
            // Set user balance from profile or default to 0
            userBalance = parseFloat(profile.balance) || 0;
            console.log('User balance set to:', userBalance);
            
            // Update profile picture if available
            if (profile.profile_picture) {
                console.log('Updating profile picture:', profile.profile_picture);
                updateProfilePicture(profile.profile_picture);
            } else {
                console.log('No profile picture found');
                // Set default profile picture
                const profilePictureContainer = document.getElementById('profile-picture-container');
                profilePictureContainer.innerHTML = '<div class="default-avatar">' + 
                    (profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U') + 
                    '</div>';
            }
        }
        
        // Load referrals
        const { data: referralsData, error: referralsError } = await supabase
            .from('profiles')
            .select('id, full_name, created_at')
            .eq('referred_by', currentUser.id);
        
        if (referralsError) {
            console.error('Referrals error:', referralsError);
            referrals = [];
        } else {
            referrals = referralsData || [];
            console.log('Referrals loaded:', referrals.length);
        }
        
        // Load transactions with better error handling
        const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10); // Increased limit to show more transactions
        
        if (transactionsError) {
            console.error('Transactions error:', transactionsError);
            transactions = [];
        } else {
            transactions = transactionsData || [];
            console.log('Transactions loaded:', transactions.length);
        }
        
        // Load investments
        const { data: investmentsData, error: investmentsError } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'active');
        
        if (investmentsError) {
            console.error('Investments error:', investmentsError);
            investments = [];
        } else {
            investments = investmentsData || [];
            console.log('Investments loaded:', investments.length);
        }
        
        // Update UI with loaded data
        updateUI();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading user data. Please refresh the page.', 'error');
    }
}

// Create user profile if it doesn't exist
async function createUserProfile() {
    try {
        const newProfile = {
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            phone_number: '',
            kyc_verified: false,
            kyc_status: 'not_submitted',
            referral_code: generateReferralCode(),
            balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);
        
        if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
        }
        
        console.log('New profile created successfully');
        userProfile = newProfile;
        
    } catch (error) {
        console.error('Failed to create user profile:', error);
        throw error;
    }
}

// Update profile picture with better error handling
function updateProfilePicture(imageUrl) {
    try {
        const profilePictureContainer = document.getElementById('profile-picture-container');
        if (!profilePictureContainer) {
            console.error('Profile picture container not found');
            return;
        }
        
        // Clear container
        profilePictureContainer.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Profile Picture';
        img.className = 'profile-picture';
        img.onerror = function() {
            // If image fails to load, show default avatar
            console.error('Failed to load profile picture:', imageUrl);
            profilePictureContainer.innerHTML = '<div class="default-avatar">' + 
                (userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U') + 
                '</div>';
        };
        
        profilePictureContainer.appendChild(img);
        console.log('Profile picture updated successfully');
        
    } catch (error) {
        console.error('Error updating profile picture:', error);
    }
}

// Show authentication screens
function showAuth() {
    console.log('Showing auth screens');
    authScreens.classList.remove('hidden');
    app.classList.add('hidden');
    showLoginScreen();
}

// Show main application
function showApp() {
    console.log('Showing main app');
    authScreens.classList.add('hidden');
    app.classList.remove('hidden');
    showDashboardScreen();
}

// Show specific screen
function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    // Hide all screens
    const screens = [
        'dashboard-screen', 'deposit-screen', 'withdrawal-screen', 
        'earn-screen', 'account-screen', 'profile-screen', 
        'kyc-screen', 'support-screen', 'faq-screen'
    ];
    screens.forEach(screen => {
        const screenElement = document.getElementById(screen);
        if (screenElement) {
            screenElement.classList.add('hidden');
        }
    });
    
    // Show the requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    } else {
        console.error('Screen not found:', screenId);
    }
    
    // Load data for specific screens
    if (screenId === 'dashboard-screen') {
        updateUI();
    } else if (screenId === 'earn-screen') {
        renderEarnPlans();
        updateActiveInvestments();
    } else if (screenId === 'kyc-screen') {
        updateKycStatus();
    } else if (screenId === 'profile-screen') {
        populateProfileForm();
    }
}

// Authentication screen navigation
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    registerScreen.classList.add('hidden');
    forgotPasswordScreen.classList.add('hidden');
}

function showRegisterScreen() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
    forgotPasswordScreen.classList.add('hidden');
}

function showForgotPasswordScreen() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.add('hidden');
    forgotPasswordScreen.classList.remove('hidden');
}

// Main screen navigation
function showDashboardScreen() {
    showScreen('dashboard-screen');
}

function showDepositScreen() {
    showScreen('deposit-screen');
}

function showWithdrawalScreen() {
    showScreen('withdrawal-screen');
}

function showEarnScreen() {
    showScreen('earn-screen');
}

function showAccountScreen() {
    showScreen('account-screen');
}

function showProfileScreen() {
    showScreen('profile-screen');
}

function showKycScreen() {
    showScreen('kyc-screen');
}

function showSupportScreen() {
    showScreen('support-screen');
}

function showFaqScreen() {
    showScreen('faq-screen');
}

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Use a simpler loading state
    const loginBtn = document.getElementById('login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = 'Signing In... <span class="spinner"></span>';
    loginBtn.disabled = true;
    
    try {
        console.log('Attempting login for:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('Login successful:', data.user.id);
        currentUser = data.user;
        await loadUserData(); // Ensure data is loaded after login
        showApp();
        showNotification('Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        // Reset button state
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const referralCode = document.getElementById('register-referral').value;
    
    if (!fullName || !email || !phone || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate phone number
    const phoneRegex = /^(07\d{8}|254\d{9})$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid phone number (07XXXXXXXX or 254XXXXXXXXX)', 'error');
        return;
    }
    
    // Use a simpler loading state
    const registerBtn = document.getElementById('register-btn');
    const originalText = registerBtn.innerHTML;
    registerBtn.innerHTML = 'Creating Account... <span class="spinner"></span>';
    registerBtn.disabled = true;
    
    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    phone_number: phone
                }
            }
        });
        
        if (authError) throw authError;
        
        console.log('Auth user created:', authData.user.id);
        
        // Get referred_by user ID if referral code provided
        let referredBy = null;
        if (referralCode) {
            const { data: referrer } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode)
                .single();
            
            if (referrer) {
                referredBy = referrer.id;
            }
        }
        
        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    full_name: fullName,
                    email: email,
                    phone_number: phone,
                    referral_code: generateReferralCode(),
                    referred_by: referredBy,
                    balance: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        
        if (profileError) {
            console.error('Profile creation error:', profileError);
            // If profile creation fails, delete the auth user to maintain consistency
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error('Failed to create user profile. Please try again.');
        }
        
        console.log('Profile created successfully');
        showNotification('Account created successfully! You can now sign in.', 'success');
        showLoginScreen();
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        // Reset button state
        registerBtn.innerHTML = originalText;
        registerBtn.disabled = false;
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        showNotification('Please enter your email', 'error');
        return;
    }
    
    // Use a simpler loading state
    const resetBtn = document.getElementById('reset-btn');
    const originalText = resetBtn.innerHTML;
    resetBtn.innerHTML = 'Sending... <span class="spinner"></span>';
    resetBtn.disabled = true;
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        
        if (error) throw error;
        
        showNotification('Password reset link sent to your email', 'success');
        showLoginScreen();
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification(error.message || 'Failed to send reset link. Please try again.', 'error');
    } finally {
        // Reset button state
        resetBtn.innerHTML = originalText;
        resetBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        console.log('Logging out user...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear all user data
        currentUser = null;
        userProfile = null;
        userBalance = 0;
        transactions = [];
        investments = [];
        referrals = [];
        
        console.log('Logout successful');
        showNotification('Logged out successfully', 'success');
        showAuth();
    } catch (error) {
        console.error('Error logging out:', error);
        showNotification('Error logging out', 'error');
    }
}

// Transaction handlers
async function handleDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    
    if (!amount || amount < 10) {
        showNotification('Minimum deposit is KES 10', 'error');
        return;
    }
    
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'error');
        return;
    }
    
    // Use a simpler loading state
    const depositBtn = document.getElementById('deposit-submit-btn');
    const originalText = depositBtn.innerHTML;
    depositBtn.innerHTML = 'Processing... <span class="spinner"></span>';
    depositBtn.disabled = true;
    
    try {
        // Use PayStack for payment processing with proper callback function
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: currentUser.email,
            amount: amount * 100, // PayStack expects amount in kobo
            currency: 'KES',
            metadata: {
                user_id: currentUser.id,
                payment_method: paymentMethod,
                custom_fields: [
                    {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: currentUser.id
                    }
                ]
            },
            callback: function(response) {
                // This is the callback function that will be called after payment
                handlePaystackCallback(response, amount, paymentMethod);
            },
            onClose: function() {
                showNotification('Payment window closed', 'warning');
                // Reset button state
                depositBtn.innerHTML = originalText;
                depositBtn.disabled = false;
            }
        });
        
        handler.openIframe();
        
    } catch (error) {
        console.error('Error processing deposit:', error);
        showNotification('Error processing deposit: ' + error.message, 'error');
        // Reset button state
        depositBtn.innerHTML = originalText;
        depositBtn.disabled = false;
    }
}

// Handle PayStack callback - IMPROVED VERSION
async function handlePaystackCallback(response, amount, paymentMethod) {
    try {
        console.log('PayStack callback received:', response);
        
        if (response.status === 'success') {
            // Payment was successful
            // Create transaction record
            const { error: transactionError } = await supabase
                .from('transactions')
                .insert([
                    {
                        user_id: currentUser.id,
                        type: 'deposit',
                        amount: amount,
                        status: 'completed',
                        payment_method: paymentMethod,
                        paystack_reference: response.reference,
                        metadata: { 
                            paystack_response: response,
                            phone: userProfile?.phone_number,
                            transaction_date: new Date().toISOString()
                        },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
            
            if (transactionError) {
                console.error('Transaction creation error:', transactionError);
                throw transactionError;
            }
            
            console.log('Transaction recorded successfully');
            
            // Update user balance - calculate new balance
            const newBalance = (userBalance || 0) + amount;
            userBalance = newBalance;
            
            // Update profile balance in database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    balance: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);
            
            if (updateError) {
                console.error('Balance update error:', updateError);
                throw updateError;
            }
            
            console.log('Balance updated successfully to:', newBalance);
            
            // Reload user data to ensure consistency
            await loadUserData();
            
            showNotification(`Deposit of KES ${amount.toLocaleString()} successful!`, 'success');
            showDashboardScreen();
        } else {
            console.error('PayStack payment failed:', response);
            showNotification('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error handling payment callback:', error);
        showNotification('Error processing payment. Please contact support if balance is not updated.', 'error');
    }
}

async function handleWithdrawal(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdrawal-amount').value);
    const phone = document.getElementById('withdrawal-phone').value;
    
    if (!amount || amount < 100) {
        showNotification('Minimum withdrawal is KES 100', 'error');
        return;
    }
    
    if (amount > userBalance) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    // Validate phone number
    const phoneRegex = /^(07\d{8}|254\d{9})$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid phone number (07XXXXXXXX or 254XXXXXXXXX)', 'error');
        return;
    }
    
    // Check KYC status
    if (!userProfile || !userProfile.kyc_verified) {
        showNotification('KYC verification required for withdrawals', 'error');
        showKycScreen();
        return;
    }
    
    // Use a simpler loading state
    const withdrawalBtn = document.getElementById('withdrawal-submit-btn');
    const originalText = withdrawalBtn.innerHTML;
    withdrawalBtn.innerHTML = 'Processing... <span class="spinner"></span>';
    withdrawalBtn.disabled = true;
    
    try {
        // Create withdrawal request
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: currentUser.id,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending',
                    payment_method: 'mobile_money',
                    metadata: { 
                        phone: phone,
                        request_date: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        
        if (transactionError) {
            console.error('Withdrawal transaction error:', transactionError);
            throw transactionError;
        }
        
        // Update user balance
        const newBalance = userBalance - amount;
        userBalance = newBalance;
        
        // Update profile balance in database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (updateError) {
            console.error('Balance update error:', updateError);
            throw updateError;
        }
        
        // Reload user data to ensure consistency
        await loadUserData();
        
        showNotification('Withdrawal request submitted. It will be processed within 24 hours.', 'success');
        showDashboardScreen();
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showNotification('Error processing withdrawal', 'error');
    } finally {
        // Reset button state
        withdrawalBtn.innerHTML = originalText;
        withdrawalBtn.disabled = false;
    }
}

async function handleKycSubmission(e) {
    e.preventDefault();
    const idType = document.getElementById('kyc-id-type').value;
    const idNumber = document.getElementById('kyc-id-number').value;
    const frontImage = document.getElementById('kyc-front').files[0];
    const selfieImage = document.getElementById('kyc-selfie').files[0];
    
    if (!idType || !idNumber || !frontImage || !selfieImage) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Use a simpler loading state
    const kycBtn = document.getElementById('kyc-submit-btn');
    const originalText = kycBtn.innerHTML;
    kycBtn.innerHTML = 'Submitting... <span class="spinner"></span>';
    kycBtn.disabled = true;
    
    try {
        // Update profile KYC status
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
                kyc_status: 'pending',
                kyc_verified: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (profileError) {
            console.error('Profile update error:', profileError);
            throw profileError;
        }
        
        // Create KYC verification record
        const { error: kycError } = await supabase
            .from('kyc_verifications')
            .insert([
                {
                    user_id: currentUser.id,
                    id_type: idType,
                    id_number: idNumber,
                    front_image_url: 'demo_front_url',
                    back_image_url: 'demo_back_url',
                    selfie_image_url: 'demo_selfie_url',
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        
        if (kycError) {
            console.error('KYC submission error:', kycError);
            throw kycError;
        }
        
        // Update local profile
        userProfile.kyc_status = 'pending';
        userProfile.kyc_verified = false;
        
        // Reload user data
        await loadUserData();
        
        updateKycStatus();
        showNotification('KYC documents submitted successfully. Verification may take 24-48 hours.', 'success');
        
    } catch (error) {
        console.error('Error submitting KYC:', error);
        showNotification('Error submitting KYC documents', 'error');
    } finally {
        // Reset button state
        kycBtn.innerHTML = originalText;
        kycBtn.disabled = false;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const fullName = document.getElementById('profile-fullname').value;
    const phone = document.getElementById('profile-phone').value;
    const profilePicture = document.getElementById('profile-picture').files[0];
    
    if (!fullName || !phone) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Validate phone number
    const phoneRegex = /^(07\d{8}|254\d{9})$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid phone number (07XXXXXXXX or 254XXXXXXXXX)', 'error');
        return;
    }
    
    // Use a simpler loading state
    const profileBtn = document.getElementById('profile-submit-btn');
    const originalText = profileBtn.innerHTML;
    profileBtn.innerHTML = 'Updating... <span class="spinner"></span>';
    profileBtn.disabled = true;
    
    try {
        // If profile picture is uploaded, use it as profile picture
        let profilePictureUrl = userProfile?.profile_picture;
        if (profilePicture) {
            // In a real app, you would upload this to Supabase Storage
            profilePictureUrl = URL.createObjectURL(profilePicture);
            updateProfilePicture(profilePictureUrl);
        }
        
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone_number: phone,
                profile_picture: profilePictureUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) {
            console.error('Profile update error:', error);
            throw error;
        }
        
        // Update local profile
        userProfile.full_name = fullName;
        userProfile.phone_number = phone;
        userProfile.profile_picture = profilePictureUrl;
        
        // Reload user data to ensure consistency
        await loadUserData();
        
        showNotification('Profile updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    } finally {
        // Reset button state
        profileBtn.innerHTML = originalText;
        profileBtn.disabled = false;
    }
}

// Investment functionality
async function handleInvestment(assetId, amount) {
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
        showNotification('Invalid asset selected', 'error');
        return;
    }
    
    if (amount < asset.min_deposit) {
        showNotification(`Minimum investment for ${asset.name} is KES ${asset.min_deposit.toLocaleString()}`, 'error');
        return;
    }
    
    if (amount > userBalance) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    try {
        // Create investment
        const { error: investmentError } = await supabase
            .from('investments')
            .insert([
                {
                    user_id: currentUser.id,
                    asset_id: assetId,
                    amount: amount,
                    apy: asset.current_apy,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        
        if (investmentError) {
            console.error('Investment error:', investmentError);
            throw investmentError;
        }
        
        // Record transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: currentUser.id,
                    type: 'investment',
                    amount: amount,
                    status: 'completed',
                    metadata: { 
                        asset_name: asset.name,
                        asset_id: assetId,
                        investment_date: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        
        if (transactionError) {
            console.error('Transaction error:', transactionError);
            throw transactionError;
        }
        
        // Update user balance
        const newBalance = userBalance - amount;
        userBalance = newBalance;
        
        // Update profile balance in database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (updateError) {
            console.error('Balance update error:', updateError);
            throw updateError;
        }
        
        // Reload data to ensure consistency
        await loadUserData();
        
        showNotification(`Successfully invested KES ${amount.toLocaleString()} in ${asset.name}`, 'success');
        
    } catch (error) {
        console.error('Error processing investment:', error);
        showNotification('Error processing investment', 'error');
    }
}

// Utility functions
function generateReferralCode() {
    return 'ZENT' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function renderInvestmentPlans() {
    const container = document.getElementById('investment-plans-container');
    
    if (!container) {
        console.error('Investment plans container not found');
        return;
    }
    
    if (!assets.length) {
        container.innerHTML = '<div class="text-center p-16">Loading investment plans...</div>';
        return;
    }
    
    container.innerHTML = assets.map(asset => `
        <div class="plan-card">
            <div class="plan-header">
                <div class="plan-name">${asset.name}</div>
                <div class="plan-apy">${asset.current_apy}% APY</div>
            </div>
            <div class="plan-details">
                <p>${asset.description}</p>
                <div class="plan-minimum">Minimum: KES ${asset.min_deposit.toLocaleString()}</div>
            </div>
            <button class="invest-btn" onclick="handleInvestment('${asset.id}', ${asset.min_deposit})" 
                    ${userBalance < asset.min_deposit ? 'disabled' : ''}>
                Invest KES ${asset.min_deposit.toLocaleString()}
            </button>
        </div>
    `).join('');
}

function renderEarnPlans() {
    const container = document.getElementById('earn-plans-container');
    renderInvestmentPlans(); // Reuse the same function
}

function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    
    if (!container) {
        console.error('Recent transactions container not found');
        return;
    }
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="text-center p-16">No recent transactions</div>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => {
        const isPositive = transaction.type === 'deposit' || transaction.type === 'referral';
        const icon = getTransactionIcon(transaction.type);
        const amountClass = isPositive ? 'amount-positive' : 'amount-negative';
        const sign = isPositive ? '+' : '-';
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon">${icon}</div>
                    <div class="transaction-details">
                        <div class="transaction-title">${getTransactionDescription(transaction)}</div>
                        <div class="transaction-date">${formatDate(transaction.created_at)}</div>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${sign} KES ${parseFloat(transaction.amount).toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
}

function updateActiveInvestments() {
    const container = document.getElementById('active-investments');
    
    if (!container) {
        console.error('Active investments container not found');
        return;
    }
    
    if (investments.length === 0) {
        container.innerHTML = '<div class="text-center p-16">No active investments</div>';
        return;
    }
    
    container.innerHTML = investments.map(investment => {
        const asset = assets.find(a => a.id === investment.asset_id);
        const dailyEarnings = investment.amount * investment.apy / 365 / 100;
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="transaction-details">
                        <div class="transaction-title">${asset ? asset.name : 'Unknown Asset'}</div>
                        <div class="transaction-date">Started ${formatDate(investment.created_at)}</div>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">KES ${parseFloat(investment.amount).toLocaleString()}</div>
                    <div class="transaction-date">Earns: KES ${dailyEarnings.toFixed(2)}/day</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateKycStatus() {
    const container = document.getElementById('kyc-status');
    const kycFormContainer = document.getElementById('kyc-form-container');
    
    if (!container) {
        console.error('KYC status container not found');
        return;
    }
    
    let statusHtml = '';
    
    const kycVerified = userProfile && userProfile.kyc_verified;
    const kycStatus = userProfile ? userProfile.kyc_status : 'not_submitted';
    
    if (kycVerified) {
        statusHtml = `
            <div class="card" style="background-color: #e8f5e8; border-left: 4px solid var(--success);">
                <div class="section-header">
                    <div class="section-title">KYC Verified</div>
                </div>
                <p>Your identity has been successfully verified. No further action required.</p>
            </div>
        `;
        // Hide KYC form if already verified
        if (kycFormContainer) kycFormContainer.classList.add('hidden');
    } else if (kycStatus === 'pending') {
        statusHtml = `
            <div class="card" style="background-color: #fff3cd; border-left: 4px solid var(--warning);">
                <div class="section-header">
                    <div class="section-title">KYC Under Review</div>
                </div>
                <p>Your documents are being reviewed. This may take 24-48 hours.</p>
            </div>
        `;
        // Hide KYC form if pending
        if (kycFormContainer) kycFormContainer.classList.add('hidden');
    } else {
        statusHtml = `
            <div class="card" style="background-color: #f8d7da; border-left: 4px solid var(--danger);">
                <div class="section-header">
                    <div class="section-title">KYC Not Verified</div>
                </div>
                <p>Please complete KYC verification to enable withdrawals.</p>
            </div>
        `;
        // Show KYC form if not submitted
        if (kycFormContainer) kycFormContainer.classList.remove('hidden');
    }
    
    container.innerHTML = statusHtml;
}

function populateProfileForm() {
    if (!userProfile) return;
    
    const fullNameInput = document.getElementById('profile-fullname');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    
    if (fullNameInput) fullNameInput.value = userProfile.full_name || '';
    if (emailInput) emailInput.value = userProfile.email || '';
    if (phoneInput) phoneInput.value = userProfile.phone_number || '';
}

function copyReferralCode() {
    const codeInput = document.getElementById('referral-code');
    if (!codeInput) {
        console.error('Referral code input not found');
        return;
    }
    
    codeInput.select();
    document.execCommand('copy');
    showNotification('Referral code copied to clipboard', 'success');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${getNotificationIcon(type)}</div>
        <div class="notification-message">${message}</div>
        <div class="notification-close">&times;</div>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

// Update UI with real data - IMPROVED VERSION
function updateUI() {
    console.log('Updating UI with user data...');
    
    // Update welcome name
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = `Welcome, ${userProfile?.full_name || 'User'}`;
    }
    
    // Update balance
    const totalBalance = document.getElementById('total-balance');
    if (totalBalance) {
        totalBalance.textContent = `KES ${(userBalance || 0).toLocaleString()}`;
    }
    
    // Calculate daily earnings
    const dailyEarnings = investments.reduce((sum, inv) => {
        return sum + (inv.amount * inv.apy / 365 / 100);
    }, 0);
    
    const profitText = document.getElementById('profit-text');
    if (profitText) {
        profitText.textContent = `+ KES ${dailyEarnings.toFixed(2)} Today`;
    }
    
    // Update KYC verification tick
    const kycTick = document.getElementById('kyc-verified-tick');
    const userVerifiedTick = document.getElementById('user-verified-tick');
    if (userProfile && userProfile.kyc_verified) {
        if (kycTick) kycTick.classList.remove('hidden');
        if (userVerifiedTick) userVerifiedTick.classList.remove('hidden');
    } else {
        if (kycTick) kycTick.classList.add('hidden');
        if (userVerifiedTick) userVerifiedTick.classList.add('hidden');
    }
    
    // Update profile verification tick
    const profileTick = document.getElementById('profile-verified-tick');
    if (userProfile && userProfile.phone_number && userProfile.full_name) {
        if (profileTick) profileTick.classList.remove('hidden');
    } else {
        if (profileTick) profileTick.classList.add('hidden');
    }
    
    // Update referral code
    const referralCodeInput = document.getElementById('referral-code');
    if (referralCodeInput && userProfile && userProfile.referral_code) {
        referralCodeInput.value = userProfile.referral_code;
    }
    
    // Update referral stats
    const referralsCount = document.getElementById('referrals-count');
    if (referralsCount) {
        referralsCount.textContent = referrals.length;
    }
    
    // Calculate referral earnings (10% of referred user's first deposit)
    const referralEarnings = referrals.length * 500; // Placeholder calculation
    const referralEarningsElement = document.getElementById('referral-earnings');
    if (referralEarningsElement) {
        referralEarningsElement.textContent = `KES ${referralEarnings.toLocaleString()}`;
    }
    
    // Render investment plans
    renderInvestmentPlans();
    updateRecentTransactions();
    updateActiveInvestments();
    
    console.log('UI update completed');
}

// Helper functions
function getTransactionIcon(type) {
    const icons = {
        deposit: '⬇️',
        withdrawal: '⬆️',
        investment: '💹',
        referral: '👤'
    };
    return icons[type] || '💸';
}

function getTransactionDescription(transaction) {
    switch (transaction.type) {
        case 'deposit':
            return `Deposit via ${transaction.payment_method || 'payment'}`;
        case 'withdrawal':
            return 'Withdrawal Request';
        case 'investment':
            return `Investment in ${transaction.metadata?.asset_name || 'Asset'}`;
        case 'referral':
            return 'Referral Earnings';
        default:
            return 'Transaction';
    }
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// Make handleInvestment available globally
window.handleInvestment = handleInvestment;

// Add real-time subscription for balance updates
function subscribeToUserUpdates() {
    if (!currentUser) return;
    
    // Subscribe to profile changes
    const profileSubscription = supabase
        .channel('profile-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${currentUser.id}`
            },
            (payload) => {
                console.log('Profile update received:', payload);
                if (payload.new) {
                    userProfile = payload.new;
                    userBalance = parseFloat(payload.new.balance) || 0;
                    updateUI();
                }
            }
        )
        .subscribe();
    
    // Subscribe to transaction changes
    const transactionSubscription = supabase
        .channel('transaction-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${currentUser.id}`
            },
            async (payload) => {
                console.log('Transaction update received:', payload);
                // Reload transactions to get the latest
                const { data: transactionsData } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (transactionsData) {
                    transactions = transactionsData;
                    updateRecentTransactions();
                }
            }
        )
        .subscribe();
    
    return { profileSubscription, transactionSubscription };
}

// Initialize real-time subscriptions when user logs in
let subscriptions = null;

// Modify the login success handler to start subscriptions
const originalHandleLogin = handleLogin;
handleLogin = async function(e) {
    await originalHandleLogin(e);
    if (currentUser) {
        subscriptions = subscribeToUserUpdates();
    }
};

// Modify the logout handler to stop subscriptions
const originalHandleLogout = handleLogout;
handleLogout = async function() {
    if (subscriptions) {
        // Unsubscribe from all channels
        supabase.removeAllChannels();
        subscriptions = null;
    }
    await originalHandleLogout();
};
