function onYaPayLoad() {
    const YaPay = window.YaPay;
    window.__YAPAY_BADGE_SANDBOX = true;

    // Данные платежа
    const paymentData = {
        env: YaPay.PaymentEnv.Sandbox,
        version: 4,
        currencyCode: YaPay.CurrencyCode.Rub,
        merchantId: '',
        totalAmount: '10000',
        availablePaymentMethods: ['SPLIT'],
    };

    async function createOrderAndGetUrl() {
        try {
            const response = await fetch("/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ total_amount: parseFloat(paymentData.totalAmount) })
            });

            const result = await response.json();
            if (!response.ok) {
                console.error("Ошибка с сервера:", result.detail)
                return;
            }

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
            alert("Что то пошло не так")

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
        YaPay.mountBadge(
            document.querySelector('#badge-cashback'),
            {
                type: 'ultimate',
                amount: paymentData.totalAmount,
                size: 'l',
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

        let isWidgetMounted = false

        YaPay.mountBadge(
            document.querySelector("#badge-toggle"), {
                type: 'bnpl',
                amount: paymentData.totalAmount,
                size: 'l',
                variant: 'detailed',
                theme: 'light',
                color: 'green',
                merchantId: paymentData.merchantId,
            }
        );
        document.querySelector("#badge-toggle").addEventListener("click", () => {
            const container = document.querySelector("#widget-toggle-container");

            if (!isWidgetMounted) {
                const widgetDiv = document.createElement("div");
                widgetDiv.id = "dynamic-widget";
                container.appendChild(widgetDiv);

                paymentSession.mountWidget(widgetDiv, {
                    widgetType: YaPay.WidgetType.Ultimate,
                    widgetTheme: YaPay.WidgetTheme.Dark,
                    borderRadius: 20,
                    padding: YaPay.WidgetPaddingType.Default,
                    withOutline: false,
                    widgetBackground: YaPay.WidgetBackgroundType.Saturated,
                    hideWidgetHeader: false,
                    widgetSize: YaPay.WidgetSize.Medium,
                })

                isWidgetMounted = true
            } else {
                container.innerHTML = ""
                isWidgetMounted = false
            }
        })

        const widgetModal = document.querySelector("#widget-modal");
        const widgetModalContainer = document.querySelector("#widget-modal-container");

        let isModalWidgetMounted = false;
        
        YaPay.mountBadge(
            document.querySelector("#badge-modal"), {
                type: 'bnpl',
                amount: paymentData.totalAmount,
                size: 'l',
                variant: 'detailed',
                theme: 'light',
                color: 'black',
                merchantId: paymentData.merchantId,
        });

        document.querySelector("#badge-modal").addEventListener("click", () => {
            widgetModal.style.display = "block"

            if (!isModalWidgetMounted) {
                const modalWidgetDiv = document.createElement("div");
                modalWidgetDiv.id = "dynamic-modal-widget";
                widgetModalContainer.appendChild(modalWidgetDiv);

                paymentSession.mountWidget(modalWidgetDiv, {
                    widgetType: YaPay.WidgetType.Ultimate,
                    widgetTheme: YaPay.WidgetTheme.White,
                    borderRadius: 20,
                    padding: YaPay.WidgetPaddingType.Default,
                    withOutline: false,
                    widgetBackground: YaPay.WidgetBackgroundType.Saturated,
                    hideWidgetHeader: false,
                    widgetSize: YaPay.WidgetSize.Medium,
                });

                isModalWidgetMounted = true;
            }
        });

        window.addEventListener("click", (e) => {
            if (e.target === widgetModal) {
                widgetModal.style.display = "none";
            }
        });

    })
    .catch(function (err) {
        console.error('Не получилось создать платежную сессию:', err);
    });
}
