function onYaPayLoad() {
    const YaPay = window.YaPay;
    window.__YAPAY_BADGE_SANDBOX = true;

    // Данные платежа
    const paymentData = {
        env: YaPay.PaymentEnv.Sandbox,
        version: 4,
        currencyCode: YaPay.CurrencyCode.Rub,
        merchantId: '',
        totalAmount: '1000.00',
        availablePaymentMethods: ['CARD', 'SPLIT'],
    };

    async function createOrderAndGetUrl() {
        try {
            const response = await fetch("/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ total_amount: parseFloat(paymentData.totalAmount) })
            });

            const result = await response.json();
            return result.paymentUrl;
        } catch (err) {
            console.error("Ошибка при создании заказа:", err);
            return;
        }
    }

    // Для отдельной кнопки
    async function onPayButtonClick() {
        return await createOrderAndGetUrl();
    }

    async function onWidgetCheckoutClick() {
        const paymentUrl = await createOrderAndGetUrl();
        if (!paymentUrl) {
            const widgetEl = document.querySelector('#widget');
            if (!widgetEl) {
                return;
            }
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Что-то пошло не так';
            errorDiv.classList.add('widget-error-temp');
            widgetEl.appendChild(errorDiv);


            setTimeout(() => errorDiv.remove(), 3000);

            return;
        }
        window.location.href = paymentUrl
    }

    // Обработчик ошибок при открытии формы оплаты
    function onFormOpenError(reason) {
        console.error(`Payment error — ${reason}`);
    }

    // Создаем платежную сессию
    YaPay.createSession(paymentData, {
        onPayButtonClick: onPayButtonClick,
        onWidgetCheckoutClick: onWidgetCheckoutClick
    })
    .then(function (paymentSession) {
        // Рендер виджета
        paymentSession.mountWidget(
            document.querySelector('#widget'),
            {
                widgetType: YaPay.WidgetType.Ultimate,
                widgetTheme: YaPay.WidgetTheme.Dark,
                borderRadius: 20,
                padding: YaPay.WidgetPaddingType.Default,
                withOutline: false,
                widgetBackground: YaPay.WidgetBackgroundType.Saturated,
                hideWidgetHeader: false,
                widgetSize: YaPay.WidgetSize.Medium,
            }
        );

        paymentSession.mountButton(document.querySelector('#button'), {
                type: YaPay.ButtonType.Pay,
                theme: YaPay.ButtonTheme.Black,
                width: YaPay.ButtonWidth.Auto,
        });

        // Рендер бейджа

    })
    .catch(function (err) {
        console.error('Не получилось создать платежную сессию:', err);
    });


    YaPay.mountBadge(
            document.querySelector('#badge-cashback'),
            {
                type: 'ultimate',
                amount: paymentData.totalAmount,
                size: 'm',
                variant: 'detailed',
                theme: 'light',
                align: 'center',
                source: 'listing',
                merchantId: paymentData.merchantId,
            }
    );
    YaPay.mountBadge(
            document.querySelector('#badge-bnpl'),
            {
                type: 'bnpl',
                amount: paymentData.totalAmount,
                size: 'l',
                variant: 'detailed',
                theme: 'light',
                color: 'green',
                merchantId: paymentData.merchantId,
            }
    );

    console.log('YaPay env:', paymentData.env);
}
