package com.trackhounds.trackhounds.Config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.trackhounds.trackhounds.Desktop.DesktopLauncher;

/**
 * Wires the desktop launcher when {@code trackhounds.desktop.enabled} is true
 * (the default for the packaged application).
 */
@Configuration
@EnableConfigurationProperties(TrackhoundsProperties.class)
public class DesktopConfig {

    @Bean
    @ConditionalOnProperty(name = "trackhounds.desktop.enabled", havingValue = "true", matchIfMissing = true)
    public DesktopLauncher desktopLauncher(TrackhoundsProperties properties,
            ObjectProvider<BuildProperties> buildProperties) {
        return new DesktopLauncher(properties, buildProperties);
    }
}
