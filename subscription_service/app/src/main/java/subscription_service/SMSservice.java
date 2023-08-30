package subscription_service;

import com.africastalking.AfricasTalking;
import com.africastalking.SmsService;
import com.africastalking.sms.Recipient;

import java.util.List;

public class SMSservice {
    // private final String AT_USERNAME = "clive";
    private final String AT_USERNAME = "sandbox";
    private final String AT_API_KEY = "b7277d37dbed16f43a50b4c4349be2ec379b630db5fd4568cbe448c8677eb3dd";
    private SmsService sms;

    // public void SMSservice() {
    //     try {
    //         System.out.println("Initializing sms service");
    //         AfricasTalking.initialize(AT_USERNAME, AT_API_KEY);

    //         this.sms = AfricasTalking.getService(AfricasTalking.SERVICE_SMS);
    //         System.out.println(this.sms);
    //     } catch(Exception e) {
    //         System.out.println(e);
    //     }
    // }

    public void sendBulk(String message, String[] recipients) {
        try {
            AfricasTalking.initialize(this.AT_USERNAME, this.AT_API_KEY);

            this.sms = AfricasTalking.getService(AfricasTalking.SERVICE_SMS);
            // System.out.println(recipients);
            List<Recipient> response = this.sms.send(message, null, recipients, true);
            

            for (Recipient recipient: response) {
                System.out.printf("%s: %s", recipient.number, recipient.status);
            }

        } catch(Exception e) {
            System.out.println("[ERROR]\n" + e.toString());
        }
    }
}
