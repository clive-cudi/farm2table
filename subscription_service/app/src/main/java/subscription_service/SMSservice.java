package subscription_service;

import com.africastalking.AfricasTalking;
import com.africastalking.SmsService;
import com.africastalking.sms.Recipient;

import java.util.List;

public class SMSservice {
    private final String AT_USERNAME = "clive";
    // private final String AT_USERNAME = "sandbox";
    // private final String AT_API_KEY = "b7277d37dbed16f43a50b4c4349be2ec379b630db5fd4568cbe448c8677eb3dd";
    private final String AT_API_KEY = "f95d1bf2c9020f0732c62e3dfb80bf21e5244bf0143246532bb9f10462267886";
    private SmsService sms;

    public void sendBulk(String message, String[] recipients) {
        try {
            AfricasTalking.initialize(this.AT_USERNAME, this.AT_API_KEY);

            this.sms = AfricasTalking.getService(AfricasTalking.SERVICE_SMS);
            System.out.println(recipients);
            // System.out.println(recipients);
            List<Recipient> response = this.sms.send(message, null, recipients, true);

            System.out.println(response);
            

            for (Recipient recipient: response) {
                System.out.printf("%s: %s", recipient.number, recipient.status);
            }

        } catch(Exception e) {
            System.out.println("[ERROR]\n" + e.toString());
        }
    }
}
