import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class LikeRetCount {

    public static class LRMapper
            extends Mapper<Object, Text, Text, Text> {

        private Text out_key = new Text();
        private Text out_value = new Text();

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {
            
            // obtaining CSV columns
            String[] fields = value.toString().split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
            if (fields[0].equals("created_at"))
                return;
            
            // saving the tweet field
            String tweet = fields[2].toLowerCase();

            // storing the number of `likes` and `retweets`
            int lCount = (int)Float.parseFloat(fields[3]);
            int rCount = (int)Float.parseFloat(fields[4]);
            out_value.set(lCount + " " + rCount);

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
            if (has_biden && !has_trump)
                out_key.set("Joe Biden");
            else if (!has_biden && has_trump)
                out_key.set("Donald Trump");
            else if (has_biden && has_trump)
                out_key.set("Both");
            else
                return;

            context.write(out_key, out_value);
        }
    }

    public static class LRReducer
            extends Reducer<Text, Text, Text, Text> {
        
        private Text result = new Text();
        
        public void reduce(Text key, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {

            int lCount = 0;
            int rCount = 0;

            for (Text val : values) {
                String[] splits = val.toString().split(" ");
                lCount += Integer.parseInt(splits[0]);
                rCount += Integer.parseInt(splits[1]);
            }

            // removing duplicate counts
            if (key.toString().equals("Both")) {
                lCount /= 2;
                rCount /= 2;
            }

            // wrting into the context
            result.set(lCount + " " + rCount);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {

        // job configuration
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "LR Count");
        job.setJarByClass(LikeRetCount.class);
        job.setMapperClass(LRMapper.class);
        job.setCombinerClass(LRReducer.class);
        job.setReducerClass(LRReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        
        // specifying input and output directories
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        // executing the job
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}