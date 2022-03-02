import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class TweetPerLocation {

    public static double[] americaRange = {19.5, 64.85, -161.75, -68};
    public static double[] franceRange = {41.6, 51, -4.65, 9.45};

    public static class TPCMapper
            extends Mapper<Object, Text, Text, IntWritable> {

        private Text country = new Text("");
        private IntWritable out_value = new IntWritable();

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {

            // splitting the line and storing `tweet`, `lat` and `long` fields
            String[] fields = value.toString().split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
            String tweet = fields[2];
            if (fields[13].equals("lat") || fields[13].equals("") || fields[14].equals(""))
                return;
            float lat = Float.parseFloat(fields[13]);
            float lng = Float.parseFloat(fields[14]);
            
            // finding user's country
            if (lat >= americaRange[0] && lat <= americaRange[1] &&
                lng >= americaRange[2] && lng <= americaRange[3]) {
                country.set("america");
            } else if (lat >= franceRange[0] && lat <= franceRange[1] &&
                    lng >= franceRange[2] && lng <= franceRange[3]) {
                country.set("france");
            }

            if (country.toString().equals(""))
                return;

            // looking for Biden hashtags
            Boolean has_biden = false;
            if (tweet.contains("#biden") ||
                tweet.contains("#joebiden"))
                has_biden = true;

            // looking for Trump hashtags
            Boolean has_trump = false;
            if (tweet.contains("#trump") ||
                tweet.contains("#donaldtrump"))
                has_trump = true;

            // writing (key, value) into the context
            // key: country name
            // value: 0 -> only Biden, 1 -> only Trump, 2 -> both
            if (has_biden && !has_trump)
                out_value.set(0);
            else if (!has_biden && has_trump)
                out_value.set(1);
            else if (has_biden && has_trump)
                out_value.set(2);
            else
                return;

            context.write(country, out_value);
        }
    }

    public static class TPCReducer
            extends Reducer<Text, IntWritable, Text, Text> {
        
        private Text result = new Text();
        
        public void reduce(Text key, Iterable<IntWritable> values, Context context)
                throws IOException, InterruptedException {

            int bidenCount = 0;
            int trumpCount = 0;
            int bothCount = 0;
            int numTweets = 0;

            // calculating the number of tweets related to each candidate
            for (IntWritable val : values) {
                numTweets += 1;

                if (val.get() == 0)
                    bidenCount += 1;
                else if (val.get() == 1)
                    trumpCount += 1;
                else
                    bothCount += 1;               
            }

            // removing duplicate counts
            bothCount /= 2;
            numTweets -= bothCount;

            // calculating percentages
            float bothPercent = (float) bothCount / numTweets;
            float bidenPercent = (float) bidenCount / numTweets;
            float trumpPercent = (float) trumpCount / numTweets;

            // wrting into the context
            result.set(bothPercent + " " + bidenPercent + " " + trumpPercent + " " + numTweets);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {

        // job configuration
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "LR Count");
        job.setJarByClass(TweetPerLocation.class);
        job.setMapperClass(TPCMapper.class);
        job.setReducerClass(TPCReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(IntWritable.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        
        // specifying input and output directories
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        // executing the job
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}