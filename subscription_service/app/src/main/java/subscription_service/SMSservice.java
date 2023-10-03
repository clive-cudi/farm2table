package subscription_service;

import com.africastalking.AfricasTalking;
import com.africastalking.SmsService;
import com.africastalking.sms.Recipient;

import java.util.List;

public class SMSservice {
    private final String AT_USERNAME = "_";
    // private final String AT_USERNAME = "_";
    // private final String AT_API_KEY = "_";
    private final String AT_API_KEY = "_";
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
