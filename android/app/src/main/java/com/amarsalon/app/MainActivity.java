package com.amarsalon.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Setup High Priority Notification Channel
        createNotificationChannel();

        // 2. Request Notification Permission on Android 13+
        requestNotificationPermission();

        // 3. Configure Hardware Back Navigation
        setupBackNavigation();

        // 4. Configure Native WebView Settings for Offline Resiliency & Custom User Agent
        configureOfflineAndWebView();
    }

    private void configureOfflineAndWebView() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // Enable local storage and database caches
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);

            // Append AmarSalonAndroid/1.0 User Agent flag so web knows it's native
            String defaultUA = settings.getUserAgentString();
            if (defaultUA != null && !defaultUA.contains("AmarSalonAndroid")) {
                settings.setUserAgentString(defaultUA + " AmarSalonAndroid/1.0");
            }

            boolean isOnline = isNetworkAvailable();
            if (!isOnline) {
                settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                String errorUrl = bridge.getErrorUrl();
                if (errorUrl != null) {
                    webView.post(() -> webView.loadUrl(errorUrl));
                }
            } else {
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            }
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network net = cm.getActiveNetwork();
            if (net == null) return false;
            NetworkCapabilities nc = cm.getNetworkCapabilities(net);
            return nc != null && (
                    nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
        } else {
            NetworkInfo ni = cm.getActiveNetworkInfo();
            return ni != null && ni.isConnected();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "amarsalon_queue_alerts";
            CharSequence name = "সিরিয়াল ও কিউ নোটিফিকেশন";
            String description = "AmarSalon Live Queue and Service Alerts";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(channelId, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 200, 100, 200, 100, 300});
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            private long lastBackPressTime = 0;

            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                } else {
                    long currentTime = System.currentTimeMillis();
                    if (currentTime - lastBackPressTime < 2000) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    } else {
                        lastBackPressTime = currentTime;
                        Toast.makeText(MainActivity.this, "অ্যাপটি বন্ধ করতে আবার ব্যাক চাপুন", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }
}
