import Footer from "@/components/Footer/FooterScreen";
import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { authApi, getUser, profileApi, removeToken, removeUser } from "@/services/api";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";

const profile = () => {
    // Enable LayoutAnimation for Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const [expandedField, setExpandedField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '••••••••',
    });
    const [notificationSettings, setNotificationSettings] = useState({
        push: true,
        email: true,
        sms: false,
    });

    // Load user data: first from local cache (instant), then refresh from API
    useEffect(() => {
        const loadUser = async () => {
            try {
                // 1. Show cached user immediately
                const cached = await getUser();
                if (cached) {
                    setFormData(prev => ({
                        ...prev,
                        name: cached.name || '',
                        email: cached.email || '',
                        phone: cached.phone || '',
                    }));
                }
                // 2. Fetch fresh data from backend
                const fresh = await profileApi.get();
                if (fresh) {
                    setFormData(prev => ({
                        ...prev,
                        name: fresh.name || prev.name,
                        email: fresh.email || prev.email,
                        phone: fresh.phone || prev.phone,
                    }));
                }
            } catch (err) {
                // If API fails, cached data is still shown — no alert needed
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const toggleField = (field) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedField(expandedField === field ? null : field);
    };

    const handleSave = (field) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedField(null);
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const toggleNotification = (key) => {
        setNotificationSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handlePaymentPress = (method) => {
        // Hook up navigation or payment method management here
    };

    const handleChangePasswordPress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedField('password');
    };

    const handleSignOutPress = async () => {
        try {
            // Call backend logout (invalidates refresh token server-side)
            await authApi.logout().catch(() => {}); // ignore network errors — still sign out locally
            // Clear stored credentials
            await removeToken();
            await removeUser();
            // Navigate to login and clear the navigation stack
            router.replace('/(auth)/login');
        } catch (error) {
            Alert.alert('Sign Out Failed', error.message || 'Please try again.');
        }
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <View style={styles.header}>

                <Text style={styles.headerTitle}>Profile</Text>

                <Feather name="settings" size={22} color={colors.primarybtn} />
            </View>
            <ScreenWrapper scrollable={true} backgroundColor="#000000">
                {/* MAIN CONTENT */}
                <View style={styles.profileContainer}>
                    <View style={styles.profileImageContainer}>
                        {loading
                            ? <ActivityIndicator size="large" color={colors.primarybtn} />
                            : <Feather name="user" size={50} color={colors.white} />
                        }
                    </View>
                    <Text style={styles.profileName}>{loading ? 'Loading...' : (formData.name || 'No Name')}</Text>
                    <Text style={styles.profileEmail}>{loading ? '' : (formData.email || 'No Email')}</Text>
                </View>

                {/* Account Information  */}
                <View style={styles.accountInfoContainer}>
                    <Text style={styles.accountSectionTitle}>Account Information</Text>

                    {/* Name Field */}
                    <View>
                        <View style={styles.accountItem}>
                            <View style={styles.accountItemLeft}>
                                <View style={styles.iconContainer}>
                                    <Feather name="user" size={20} color={colors.subheading} />
                                </View>
                                <View style={styles.accountItemTextContainer}>
                                    <Text style={styles.accountItemLabel}>Name</Text>
                                    <Text style={styles.accountItemValue}>{formData.name}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleField('name')} style={styles.chevronButton}>
                                <Feather
                                    name={expandedField === 'name' ? "chevron-down" : "chevron-right"}
                                    size={20}
                                    color={colors.subheading}
                                />
                            </TouchableOpacity>
                        </View>
                        {expandedField === 'name' && (
                            <View style={styles.editContainer}>
                                <Text style={styles.editLabel}>Edit Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.name}
                                    onChangeText={(value) => handleChange('name', value)}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.subheading}
                                    autoFocus
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setExpandedField(null)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('name')}>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Email Field */}
                    <View>
                        <View style={styles.accountItem}>
                            <View style={styles.accountItemLeft}>
                                <View style={styles.iconContainer}>
                                    <Feather name="mail" size={20} color={colors.subheading} />
                                </View>
                                <View style={styles.accountItemTextContainer}>
                                    <Text style={styles.accountItemLabel}>Email</Text>
                                    <Text style={styles.accountItemValue}>{formData.email}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleField('email')} style={styles.chevronButton}>
                                <Feather
                                    name={expandedField === 'email' ? "chevron-down" : "chevron-right"}
                                    size={20}
                                    color={colors.subheading}
                                />
                            </TouchableOpacity>
                        </View>
                        {expandedField === 'email' && (
                            <View style={styles.editContainer}>
                                <Text style={styles.editLabel}>Edit Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.email}
                                    onChangeText={(value) => handleChange('email', value)}
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.subheading}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoFocus
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setExpandedField(null)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('email')}>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Phone Number Field */}
                    <View>
                        <View style={styles.accountItem}>
                            <View style={styles.accountItemLeft}>
                                <View style={styles.iconContainer}>
                                    <Feather name="phone" size={20} color={colors.subheading} />
                                </View>
                                <View style={styles.accountItemTextContainer}>
                                    <Text style={styles.accountItemLabel}>Phone Number</Text>
                                    <Text style={styles.accountItemValue}>{formData.phone}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleField('phone')} style={styles.chevronButton}>
                                <Feather
                                    name={expandedField === 'phone' ? "chevron-down" : "chevron-right"}
                                    size={20}
                                    color={colors.subheading}
                                />
                            </TouchableOpacity>
                        </View>
                        {expandedField === 'phone' && (
                            <View style={styles.editContainer}>
                                <Text style={styles.editLabel}>Edit Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.phone}
                                    onChangeText={(value) => handleChange('phone', value)}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={colors.subheading}
                                    keyboardType="phone-pad"
                                    autoFocus
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setExpandedField(null)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('phone')}>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Password Field */}
                    <View>
                        <View style={styles.accountItem}>
                            <View style={styles.accountItemLeft}>
                                <View style={styles.iconContainer}>
                                    <Feather name="lock" size={20} color={colors.subheading} />
                                </View>
                                <View style={styles.accountItemTextContainer}>
                                    <Text style={styles.accountItemLabel}>Password</Text>
                                    <Text style={styles.accountItemValue}>{formData.password}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleField('password')} style={styles.chevronButton}>
                                <Feather
                                    name={expandedField === 'password' ? "chevron-down" : "chevron-right"}
                                    size={20}
                                    color={colors.subheading}
                                />
                            </TouchableOpacity>
                        </View>
                        {expandedField === 'password' && (
                            <View style={styles.editContainer}>
                                <Text style={styles.editLabel}>Change Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.password}
                                    onChangeText={(value) => handleChange('password', value)}
                                    placeholder="Enter new password"
                                    placeholderTextColor={colors.subheading}
                                    secureTextEntry
                                    autoFocus
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setExpandedField(null)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('password')}>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* payment details */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Payment Methods</Text>

                    <TouchableOpacity
                        style={styles.listItem}
                        onPress={() => handlePaymentPress('card')}
                    >
                        <View style={styles.listItemLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="credit-card" size={18} color={colors.subheading} />
                            </View>
                            <View>
                                <Text style={styles.listItemLabel}>Visa •••• 1234</Text>
                                <Text style={styles.listItemSubtext}>Expires 12/26</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={colors.subheading} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.listItem, styles.listItemNoBorder]}
                        onPress={() => handlePaymentPress('googlePay')}
                    >
                        <View style={styles.listItemLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="smartphone" size={18} color={colors.subheading} />
                            </View>
                            <View>
                                <Text style={styles.listItemLabel}>Google Pay</Text>
                                <Text style={styles.listItemSubtext}>Connected</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={colors.subheading} />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Notification Settings</Text>

                    <View style={styles.toggleItem}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="bell" size={18} color={colors.subheading} />
                            </View>
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.listItemLabel}>Push Notifications</Text>
                                <Text style={styles.listItemSubtext}>Receive alerts for bookings and messages.</Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationSettings.push}
                            onValueChange={() => toggleNotification('push')}
                            trackColor={{ false: '#2a2a2a', true: '#F5515F' }}
                            thumbColor={notificationSettings.push ? '#ffffff' : '#d6d6d6'}
                        />
                    </View>

                    <View style={styles.toggleItem}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="mail" size={18} color={colors.subheading} />
                            </View>
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.listItemLabel}>Email Notifications</Text>
                                <Text style={styles.listItemSubtext}>Get updates on your registered email.</Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationSettings.email}
                            onValueChange={() => toggleNotification('email')}
                            trackColor={{ false: '#2a2a2a', true: '#F5515F' }}
                            thumbColor={notificationSettings.email ? '#ffffff' : '#d6d6d6'}
                        />
                    </View>

                    <View style={[styles.toggleItem, styles.listItemNoBorder]}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="message-square" size={18} color={colors.subheading} />
                            </View>
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.listItemLabel}>SMS Alerts</Text>
                                <Text style={styles.listItemSubtext}>Receive booking reminders via text.</Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationSettings.sms}
                            onValueChange={() => toggleNotification('sms')}
                            trackColor={{ false: '#2a2a2a', true: '#F5515F' }}
                            thumbColor={notificationSettings.sms ? '#ffffff' : '#d6d6d6'}
                        />
                    </View>
                </View>

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePasswordPress}>
                        <Text style={styles.changePasswordText}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOutPress}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

            </ScreenWrapper>
            <Footer active="profile" />
        </>
    )
}

export default profile

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: spacing.lg,
        height: 80,
        backgroundColor: colors.topbardark,
        paddingBottom: spacing.md,
        marginTop: spacing.md,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        flex: 1,
    },
    headerTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.mx,
        color: "#F3F4F6",
        flex: 1,

        marginLeft: 10, // To offset the back button space
    },

    // main content styles can be added here
    // profile
    profileContainer: {
        padding: spacing.lg,
        borderRadius: 10,
        alignItems: 'center',
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    profileName: {
        fontFamily: fonts.heading,
        fontSize: 20,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    profileEmail: {
        fontFamily: fonts.text,
        fontSize: spacing.md,
        color: colors.subheading,
        textAlign: 'center',
        marginBottom: spacing.lg,

    },

    // Account Section
    accountInfoContainer: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        marginHorizontal: spacing.md,
        borderRadius: 12,
        padding: spacing.md,
    },
    accountSectionTitle: {
        fontFamily: fonts.heading,
        fontSize: 16,
        color: colors.white,
        marginBottom: spacing.md,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    accountItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#323743',
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountItemTextContainer: {
        flex: 1,
    },
    accountItemLabel: {
        fontFamily: fonts.text,
        fontSize: spacing.sxx,
        color: colors.subheading,
        marginBottom: 2,
    },
    accountItemValue: {
        fontFamily: fonts.text,
        fontSize: spacing.md,
        color: colors.white,
    },
    chevronButton: {
        padding: spacing.sm,
    },
    editContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: '#0d0d0d',
        borderRadius: 12,
        marginTop: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    editLabel: {
        fontFamily: fonts.heading,
        fontSize: 14,
        color: colors.white,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md + 2,
        color: colors.white,
        fontFamily: fonts.body,
        fontSize: 14,
        borderWidth: 1.5,
        borderColor: '#3a3a3a',
        marginBottom: spacing.lg,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#da8484',
        borderRadius: 10,
        paddingVertical: spacing.md + 2,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    cancelButtonText: {
        color: colors.white,
        fontFamily: fonts.heading,
        fontSize: spacing.md,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.base,
        borderRadius: 10,
        paddingVertical: spacing.md + 2,
        alignItems: 'center',
    },
    saveButtonText: {
        color: colors.white,
        fontFamily: fonts.heading,
        fontSize: 14,
    },

    // Payment + Notification sections
    sectionCard: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        marginHorizontal: spacing.md,
        borderRadius: 12,
        padding: spacing.md,
    },
    sectionTitle: {
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        color: colors.white,
        marginBottom: spacing.md,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#323743',
    },
    listItemNoBorder: {
        borderBottomWidth: 0,
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    listItemLabel: {
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        color: colors.white,
        marginBottom: 2,
    },
    listItemSubtext: {
        fontFamily: fonts.text,
        fontSize: spacing.sxx,
        color: colors.subheading,
    },
    toggleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#323743',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
        paddingRight: spacing.md,
    },
    toggleTextContainer: {
        flex: 1,
    },

    // Action buttons
    actionButtonsContainer: {
        marginTop: spacing.md,
        marginHorizontal: spacing.md,
        gap: spacing.md,
        paddingBottom: spacing.xl,
        marginBottom: spacing.xl + 20,
    },
    changePasswordButton: {
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
        backgroundColor: '#0f0f0f',
    },
    changePasswordText: {
        color: colors.white,
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        fontWeight: '700',
    },
    signOutButton: {
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
        backgroundColor: '#d35454',
    },
    signOutText: {
        color: colors.white,
        fontFamily: fonts.heading,
        fontSize: spacing.md,
        fontWeight: '700',
    },


})