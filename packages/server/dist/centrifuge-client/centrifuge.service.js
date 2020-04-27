"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const centrifuge_node_client_1 = require("@centrifuge/gateway-lib/centrifuge-node-client");
const config_1 = require("../config");
const util_1 = require("util");
const common_1 = require("@nestjs/common");
const delay = util_1.promisify(setTimeout);
class CentrifugeService {
    constructor() {
        this.documents = new centrifuge_node_client_1.DocumentsApi({}, config_1.default.centrifugeUrl);
        this.accounts = new centrifuge_node_client_1.AccountsApi({}, config_1.default.centrifugeUrl);
        this.funding = new centrifuge_node_client_1.FundingAgreementsApi({}, config_1.default.centrifugeUrl);
        this.nft = new centrifuge_node_client_1.NFTsApi({}, config_1.default.centrifugeUrl);
        this.job = new centrifuge_node_client_1.JobsApi({}, config_1.default.centrifugeUrl);
        this.transfer = new centrifuge_node_client_1.TransferDetailsApi({}, config_1.default.centrifugeUrl);
    }
    pullForJobComplete(jobId, authorization) {
        return this.job.getJobStatus(authorization, jobId).then(result => {
            if (result.status === 'pending') {
                return delay(500).then(() => this.pullForJobComplete(jobId, authorization));
            }
            else if (result.status === 'failed') {
                console.log('Job Failed', result);
                throw new common_1.BadRequestException(result.message);
            }
            else {
                console.log('Job Complete', result);
                return result;
            }
        });
    }
}
exports.CentrifugeService = CentrifugeService;
//# sourceMappingURL=centrifuge.service.js.map