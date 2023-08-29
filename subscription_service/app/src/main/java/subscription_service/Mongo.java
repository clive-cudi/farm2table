package subscription_service;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoException;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class Mongo {
    public String connectionString;
    public MongoDatabase mongoDatabase;
    public Mongo(String connection_string) {
        this.connectionString = connection_string;
    }

    public MongoDatabase init() throws MongoException {
        // ServerApi serverApi = ServerApi.builder()
        //     .version(ServerApiVersion.V1)
        //     .build();
        // MongoClientSettings settings = MongoClientSettings.builder()
        //     .applyConnectionString(new ConnectionString(this.connectionString))
        //     .serverApi(serverApi)
        //     .build();

        MongoClient mongoClient = MongoClients.create(this.connectionString);

        this.mongoDatabase = mongoClient.getDatabase("farm2tableDB");
        

        // mongoClient.listDatabaseNames().forEach(System.out::println);

        return this.mongoDatabase;
    }
}
