import Footer from "@/components/Footer/FooterScreen";
import { PageWrapper } from '@/components/PageLoader';
import ScreenWrapper from "@/components/SafeGurdForScreen/ScreenWrapper";
import AppHeader from "@/components/AppHeader/AppHeader";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { spacing } from "@/constants/spacing";
import { rf, rs, rh, rsp } from "@/constants/rs";
import { authApi, getUser, profileApi, removeToken, removeUser } from "@/services/api";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
    const [avatarUri, setAvatarUri] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
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
                        name:  cached.name  || '',
                        email: cached.email || '',
                        phone: cached.phone || '',
                    }));
                    if (cached.avatarUrl) setAvatarUri(cached.avatarUrl);
                }
                // 2. Fetch fresh data from backend
                const fresh = await profileApi.get();
                if (fresh) {
                    setFormData(prev => ({
                        ...prev,
                        name:  fresh.name  || prev.name,
                        email: fresh.email || prev.email,
                        phone: fresh.phone || prev.phone,
                    }));
                    if (fresh.avatarUrl) setAvatarUri(fresh.avatarUrl);
                }
            } catch (_) {
                // If API fails, cached data is still shown
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const toggleNotification = (key) => {
        setNotificationSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;
        const uri = result.assets[0].uri;
        // Show new image immediately (optimistic update)
        setAvatarUri(uri);
        try {
            setAvatarUploading(true);
            const updated = await profileApi.uploadAvatar(uri);
            // Use the Cloudinary URL returned from server as the final URI
            if (updated?.avatarUrl) {
                setAvatarUri(updated.avatarUrl);
                // Update local cache so it persists across sessions
                const cached = await import('@react-native-async-storage/async-storage')
                    .then(m => m.default.getItem('user'));
                if (cached) {
                    const user = JSON.parse(cached);
                    user.avatarUrl = updated.avatarUrl;
                    await import('@react-native-async-storage/async-storage')
                        .then(m => m.default.setItem('user', JSON.stringify(user)));
                }
            }
        } catch (err) {
            Alert.alert('Upload failed', err.message || 'Could not upload photo.');
            // Revert to previous avatar on failure
            setAvatarUri(null);
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSignOutPress = async () => {
        try {
            await authApi.logout().catch(() => {}); // invalidate refresh token server-side
            // Clear all stored session data
            await removeToken();
            await removeUser();
            await import('@react-native-async-storage/async-storage')
                .then(m => m.default.multiRemove(['refreshToken', 'loginTime']));
            router.replace('/(auth)/login');
        } catch (error) {
            Alert.alert('Sign Out Failed', error.message || 'Please try again.');
        }
    };

    return (
        <>
            <StatusBar style="light" backgroundColor={colors.topbardark} />
            <AppHeader title="My Profile" />
            <ScreenWrapper scrollable={true} backgroundColor="#000000">
                {/* MAIN CONTENT */}
                <View style={styles.profileContainer}>
                    <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} activeOpacity={0.85}>
                        <View style={styles.profileImageContainer}>
                            {loading ? (
                                <ActivityIndicator size="large" color={colors.primarybtn} />
                            ) : avatarUri ? (
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <Feather name="user" size={rf(50)} color={colors.white} />
                            )}
                        </View>
                        <View style={styles.cameraButton}>
                            {avatarUploading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Feather name="camera" size={rf(14)} color="#fff" />
                            }
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.profileName}>{loading ? 'Loading...' : (formData.name || 'No Name')}</Text>
                    <Text style={styles.profileEmail}>{loading ? '' : (formData.email || 'No Email')}</Text>
                    <Text style={styles.changePhotoText}>Tap photo to change</Text>
                </View>

                {/* Account Information  */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Settings</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/details/accountsettings')} activeOpacity={0.7}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#1f2937' }]}>
                                <Feather name="user" size={rf(18)} color={colors.primarybtn} />
                            </View>
                            <View>
                                <Text style={styles.menuItemTitle}>Account Settings</Text>
                                <Text style={styles.menuItemSub}>Edit name, email, phone & password</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={rf(18)} color={colors.subheading} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/chat')} activeOpacity={0.7}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#1f2937' }]}>
                                <Feather name="message-square" size={rf(18)} color={colors.primarybtn} />
                            </View>
                            <View>
                                <Text style={styles.menuItemTitle}>Help & Support</Text>
                                <Text style={styles.menuItemSub}>Get help with bookings & services</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={rf(18)} color={colors.subheading} />
                    </TouchableOpacity>
                </View>

                {/* Payments — Coming Soon */}
                <View style={styles.menuSection}>
                    <View style={styles.menuSectionTitleRow}>
                        <Text style={styles.menuSectionTitle}>Payments</Text>
                        <View style={styles.comingSoonPill}>
                            <Feather name="lock" size={rf(10)} color="#a78bfa" />
                            <Text style={styles.comingSoonPillText}>Coming Soon</Text>
                        </View>
                    </View>

                    {[
                        { icon: 'clock',       title: 'Last Payment',    sub: 'View your recent transactions' },
                        { icon: 'file-text',   title: 'Invoices',        sub: 'Download & view your invoices' },
                        { icon: 'credit-card', title: 'Payment Method',  sub: 'Manage your saved cards & UPI', last: true },
                    ].map((item) => (
                        <View
                            key={item.title}
                            style={[styles.menuItem, item.last && { borderBottomWidth: 0 }, styles.menuItemLocked]}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBox, { backgroundColor: '#1a1a22' }]}>
                                    <Feather name={item.icon} size={rf(18)} color="#555" />
                                </View>
                                <View>
                                    <Text style={[styles.menuItemTitle, { color: '#555' }]}>{item.title}</Text>
                                    <Text style={[styles.menuItemSub, { color: '#444' }]}>{item.sub}</Text>
                                </View>
                            </View>
                            <Feather name="lock" size={rf(14)} color="#444" />
                        </View>
                    ))}
                </View>

                {/* Refer & Earn — Coming Soon */}
                <View style={styles.menuSection}>
                    <View style={styles.menuSectionTitleRow}>
                        <Text style={styles.menuSectionTitle}>Refer & Earn</Text>
                        <View style={styles.comingSoonPill}>
                            <Feather name="lock" size={rf(10)} color="#a78bfa" />
                            <Text style={styles.comingSoonPillText}>Coming Soon</Text>
                        </View>
                    </View>

                    {[
                        { icon: 'user-plus',   title: 'Refer a Friend',    sub: 'Share your code & earn 100 coins' },
                        { icon: 'award',       title: 'Earn Coins',        sub: 'How to earn & use your coins' },
                        { icon: 'dollar-sign', title: 'Coin Calculation',  sub: '1 coin = ₹1 · See your balance', last: true },
                    ].map((item) => (
                        <View
                            key={item.title}
                            style={[styles.menuItem, item.last && { borderBottomWidth: 0 }, styles.menuItemLocked]}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBox, { backgroundColor: '#1a1a22' }]}>
                                    <Feather name={item.icon} size={rf(18)} color="#555" />
                                </View>
                                <View>
                                    <Text style={[styles.menuItemTitle, { color: '#555' }]}>{item.title}</Text>
                                    <Text style={[styles.menuItemSub, { color: '#444' }]}>{item.sub}</Text>
                                </View>
                            </View>
                            <Feather name="lock" size={rf(14)} color="#444" />
                        </View>
                    ))}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Notification Settings</Text>

                    <View style={styles.toggleItem}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconContainer}>
                                <Feather name="bell" size={rf(18)} color={colors.subheading} />
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
                                <Feather name="mail" size={rf(18)} color={colors.subheading} />
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
                                <Feather name="message-square" size={rf(18)} color={colors.subheading} />
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
        display: 'none',
    },
    headerContent: {
        display: 'none',
    },
    headerTitle: {
        display: 'none',
    },

    // main content styles can be added here
    // profile
    profileContainer: {
        padding: spacing.lg,
        borderRadius: 10,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: spacing.lg,
    },
    profileImageContainer: {
        width: rs(110),
        height: rs(110),
        borderRadius: rs(55),
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.primarybtn,
        overflow: 'hidden',
    },
    avatarImage: {
        width: rs(110),
        height: rs(110),
        borderRadius: rs(55),
    },
    cameraButton: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: rs(30),
        height: rs(30),
        borderRadius: rs(15),
        backgroundColor: colors.primarybtn,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    profileName: {
        fontFamily: fonts.heading,
        fontSize: rf(20),
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    profileEmail: {
        fontFamily: fonts.text,
        fontSize: rf(14),
        color: colors.subheading,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    changePhotoText: {
        fontFamily: fonts.text,
        fontSize: rf(13),
        color: colors.primarybtn,
        marginBottom: spacing.lg,
    },

    menuSection: {
        marginTop: spacing.md,
        marginHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        borderRadius: rs(14),
        overflow: 'hidden',
    },
    menuSectionTitle: {
        fontFamily: fonts.heading,
        fontSize: rf(13),
        color: colors.subheading,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuSectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    comingSoonPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(4),
        backgroundColor: 'rgba(167,139,250,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.3)',
        paddingHorizontal: rs(8),
        paddingVertical: rs(3),
        borderRadius: rs(20),
    },
    comingSoonPillText: {
        fontFamily: fonts.text,
        fontSize: rf(10),
        color: '#a78bfa',
        fontWeight: '600',
    },
    menuItemLocked: {
        opacity: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    menuIconBox: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemTitle: {
        fontFamily: fonts.subheading,
        fontSize: rf(14),
        color: colors.white,
        marginBottom: 2,
    },
    menuItemSub: {
        fontFamily: fonts.text,
        fontSize: rf(12),
        color: colors.inactive,
    },

    accountInfoContainer: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        marginHorizontal: spacing.md,
        borderRadius: rs(12),
        padding: spacing.md,
    },
    accountSectionTitle: {
        fontFamily: fonts.heading,
        fontSize: rf(16),
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
        width: rs(40),
        height: rs(40),
        borderRadius: rs(8),
        backgroundColor: '#323743',
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountItemTextContainer: {
        flex: 1,
    },
    accountItemLabel: {
        fontFamily: fonts.text,
        fontSize: rf(13),
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
        fontSize: rf(14),
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
        fontSize: rf(14),
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
        fontSize: rf(14),
    },

    // Payment + Notification sections
    sectionCard: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#1E2128',
        marginHorizontal: spacing.md,
        borderRadius: rs(12),
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
        borderRadius: rs(12),
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
        borderRadius: rs(12),
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