using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;
using System.Text;
using System.IO;
using System.Web.Hosting;
using System.Web;

namespace COBS
{
    [ServiceContract(Namespace = "")]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class Data
    {
        // To use HTTP GET, add [WebGet] attribute. (Default ResponseFormat is WebMessageFormat.Json)
        // To create an operation that returns XML,
        //     add [WebGet(ResponseFormat=WebMessageFormat.Xml)],
        //     and include the following line in the operation body:
        //         WebOperationContext.Current.OutgoingResponse.ContentType = "text/xml";
        [OperationContract]
        [WebGet(ResponseFormat=WebMessageFormat.Json)]
        public Stream GetData(string id)
        {
            // Add your operation implementation here
            HttpContext.Current.Response.ContentType = "application/json";
            WebOperationContext.Current.OutgoingResponse.ContentType = "application/json";
            string fileSpec = "~/gamedata/" + id + ".json";
            fileSpec = HttpContext.Current.Server.MapPath(fileSpec);           
            Stream sr = File.OpenRead(fileSpec);
            return sr;
        }


        // Add more operations here and mark them with [OperationContract]
    }
}
