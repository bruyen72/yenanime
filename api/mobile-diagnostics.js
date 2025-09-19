/**
 * Diagnósticos para Dispositivos Móveis - Knight Bot
 * Detecta e resolve problemas comuns com QR codes e pareamento
 */

/**
 * Detecta tipo de dispositivo e browser
 */
function detectMobileEnvironment(userAgent) {
    const ua = userAgent.toLowerCase();

    const detection = {
        device: {
            is_mobile: /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua),
            is_ios: /iphone|ipad|ipod/i.test(ua),
            is_android: /android/i.test(ua),
            is_tablet: /ipad|tablet|kindle|playbook|silk/i.test(ua)
        },
        browser: {
            is_whatsapp: /whatsapp/i.test(ua),
            is_chrome: /chrome/i.test(ua) && !/edge|edg/i.test(ua),
            is_safari: /safari/i.test(ua) && !/chrome/i.test(ua),
            is_firefox: /firefox/i.test(ua),
            is_edge: /edge|edg/i.test(ua)
        },
        whatsapp: {
            has_whatsapp_business: false, // Detectado via features
            supports_qr: true,
            supports_pairing: true
        }
    };

    // Detecta se suporta recursos WhatsApp
    detection.whatsapp.supports_qr = !detection.device.is_mobile || detection.browser.is_whatsapp;
    detection.whatsapp.supports_pairing = true; // Sempre suportado

    return detection;
}

/**
 * Gera instruções específicas para o dispositivo
 */
function generateDeviceInstructions(detection) {
    const instructions = {
        qr_code: [],
        pairing_code: [],
        troubleshooting: []
    };

    if (detection.device.is_ios) {
        instructions.qr_code = [
            '📱 Para iOS (iPhone/iPad):',
            '1. Abra o WhatsApp no iPhone',
            '2. Toque em "Configurações" (canto inferior direito)',
            '3. Toque em "Aparelhos conectados"',
            '4. Toque em "Conectar um aparelho"',
            '5. Use Face ID/Touch ID para autenticar',
            '6. Escaneie o QR code na tela'
        ];

        instructions.pairing_code = [
            '📱 Código de Pareamento - iOS:',
            '1. Abra o WhatsApp no iPhone',
            '2. Vá em Configurações → Aparelhos conectados',
            '3. Toque em "Conectar um aparelho"',
            '4. Toque em "Conectar com número de telefone"',
            '5. Digite o código de 8 dígitos mostrado',
            '6. Aguarde a confirmação'
        ];

        instructions.troubleshooting = [
            '🔧 Solução de Problemas iOS:',
            '• Certifique-se que o WhatsApp está atualizado',
            '• Verifique se a câmera tem permissão',
            '• Limpe a lente da câmera',
            '• Use boa iluminação para escanear',
            '• Desative VPN se estiver usando',
            '• Reinicie o app WhatsApp'
        ];

    } else if (detection.device.is_android) {
        instructions.qr_code = [
            '🤖 Para Android:',
            '1. Abra o WhatsApp no Android',
            '2. Toque nos três pontos (menu) no canto superior direito',
            '3. Selecione "Aparelhos conectados"',
            '4. Toque em "Conectar um aparelho"',
            '5. Use impressão digital/PIN para autenticar',
            '6. Escaneie o QR code na tela'
        ];

        instructions.pairing_code = [
            '🤖 Código de Pareamento - Android:',
            '1. Abra o WhatsApp no Android',
            '2. Menu (⋮) → Aparelhos conectados',
            '3. Toque em "Conectar um aparelho"',
            '4. Escolha "Conectar com número"',
            '5. Digite o código de 8 dígitos',
            '6. Confirme a conexão'
        ];

        instructions.troubleshooting = [
            '🔧 Solução de Problemas Android:',
            '• Atualize o WhatsApp na Play Store',
            '• Permita acesso à câmera nas configurações',
            '• Limpe o cache do WhatsApp',
            '• Verifique conexão com internet',
            '• Desabilite bloqueador de anúncios',
            '• Teste em modo avião (ligar/desligar)'
        ];

    } else {
        // Desktop/Web
        instructions.qr_code = [
            '💻 Para Desktop/Web:',
            '1. Mantenha esta página aberta',
            '2. Use seu celular para escanear',
            '3. Siga as instruções específicas do seu celular',
            '4. Mantenha ambos dispositivos conectados à internet'
        ];

        instructions.pairing_code = [
            '💻 Código Desktop:',
            '1. Use o código gerado nesta página',
            '2. Digite no seu celular conforme instruções',
            '3. Aguarde confirmação em ambos dispositivos'
        ];
    }

    return instructions;
}

/**
 * Diagnostica problemas comuns
 */
function diagnoseMobileIssues(detection, errorType = null) {
    const diagnosis = {
        common_issues: [],
        specific_solutions: [],
        compatibility: {
            qr_supported: true,
            pairing_supported: true,
            recommended_method: 'qr'
        }
    };

    // Problemas comuns por plataforma
    if (detection.device.is_ios) {
        diagnosis.common_issues.push(
            'iOS pode requerer autenticação Face ID/Touch ID',
            'Câmera pode precisar de permissão explícita',
            'WhatsApp Business e WhatsApp regular são apps separados'
        );

        diagnosis.specific_solutions.push(
            'Vá em Configurações → Privacidade → Câmera → WhatsApp',
            'Certifique-se de usar o app correto (WhatsApp vs WhatsApp Business)',
            'Tente fechar e abrir o WhatsApp novamente'
        );

    } else if (detection.device.is_android) {
        diagnosis.common_issues.push(
            'Permissões de câmera podem estar bloqueadas',
            'Cache do app pode estar corrompido',
            'Alguns launchers Android causam conflitos'
        );

        diagnosis.specific_solutions.push(
            'Limpe dados e cache do WhatsApp',
            'Verifique se há atualizações pendentes',
            'Teste em modo seguro se possível'
        );
    }

    // Problemas de conectividade
    if (errorType === 'network') {
        diagnosis.common_issues.push(
            'Conexão instável com internet',
            'VPN ou proxy interferindo',
            'Firewall corporativo bloqueando'
        );

        diagnosis.specific_solutions.push(
            'Teste com dados móveis e WiFi alternadamente',
            'Desative VPN temporariamente',
            'Use rede pessoal em vez de corporativa'
        );
    }

    // Problemas com QR Code
    if (errorType === 'qr_scan') {
        diagnosis.common_issues.push(
            'QR code não está sendo reconhecido',
            'Câmera não consegue focar',
            'Iluminação inadequada'
        );

        diagnosis.specific_solutions.push(
            'Aproxime ou afaste o celular do QR code',
            'Certifique-se que o QR está totalmente visível',
            'Use o código de pareamento como alternativa'
        );

        // Recomenda pareamento em caso de problemas com QR
        diagnosis.compatibility.recommended_method = 'pairing';
    }

    return diagnosis;
}

/**
 * Gera QR Code otimizado para mobile
 */
function generateMobileOptimizedQR(data, options = {}) {
    const defaultOptions = {
        size: 400, // Maior para mobile
        margin: 4, // Margem maior
        errorCorrectionLevel: 'H', // Máxima correção de erro
        dark_color: '#000000',
        light_color: '#FFFFFF'
    };

    const qrOptions = { ...defaultOptions, ...options };

    return {
        qr_options: qrOptions,
        mobile_tips: [
            'QR otimizado para telas móveis',
            'Erro de correção nível alto (H)',
            'Tamanho 400x400 para melhor escaneamento',
            'Contraste máximo preto/branco'
        ]
    };
}

/**
 * Valida ambiente para WhatsApp Business
 */
function validateWhatsAppBusinessEnvironment(detection) {
    const validation = {
        is_compatible: true,
        warnings: [],
        requirements: [],
        recommendations: []
    };

    // Verifica compatibilidade básica
    if (!detection.device.is_mobile && !detection.browser.is_chrome && !detection.browser.is_firefox && !detection.browser.is_edge) {
        validation.warnings.push('Browser pode não ser totalmente compatível');
        validation.recommendations.push('Use Chrome, Firefox ou Edge para melhor compatibilidade');
    }

    // Requisitos para WhatsApp Business
    validation.requirements = [
        'WhatsApp ou WhatsApp Business instalado no celular',
        'Número de telefone verificado no WhatsApp',
        'Conexão estável com internet',
        'Permissões de câmera liberadas'
    ];

    // Recomendações específicas
    if (detection.device.is_ios) {
        validation.recommendations.push(
            'Mantenha o iOS atualizado',
            'Use Face ID/Touch ID quando solicitado',
            'Certifique-se que o WhatsApp está na versão mais recente'
        );
    } else if (detection.device.is_android) {
        validation.recommendations.push(
            'Limpe cache do WhatsApp periodicamente',
            'Verifique permissões de câmera nas configurações',
            'Use Google Play Store para atualizações'
        );
    }

    return validation;
}

/**
 * Gera relatório completo de diagnóstico
 */
function generateDiagnosticReport(userAgent, errorType = null) {
    const detection = detectMobileEnvironment(userAgent);
    const instructions = generateDeviceInstructions(detection);
    const diagnosis = diagnoseMobileIssues(detection, errorType);
    const validation = validateWhatsAppBusinessEnvironment(detection);
    const qrOptimization = generateMobileOptimizedQR();

    return {
        timestamp: new Date().toISOString(),
        device_detection: detection,
        instructions: instructions,
        diagnosis: diagnosis,
        validation: validation,
        qr_optimization: qrOptimization,
        summary: {
            platform: detection.device.is_ios ? 'iOS' : detection.device.is_android ? 'Android' : 'Desktop',
            recommended_method: diagnosis.compatibility.recommended_method,
            compatibility_score: validation.is_compatible ? 100 : 75
        }
    };
}

module.exports = {
    detectMobileEnvironment,
    generateDeviceInstructions,
    diagnoseMobileIssues,
    generateMobileOptimizedQR,
    validateWhatsAppBusinessEnvironment,
    generateDiagnosticReport
};