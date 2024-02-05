import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { register } from 'prom-client';

@ApplyOptions<Route.Options>({
	route: 'metrics'
})
export class UserRoute extends Route {
	public [methods.GET](_request: ApiRequest, response: ApiResponse) {
		register.metrics().then((data) => {
			response.setHeader('Content-Type', register.contentType);
			response.statusCode = 200;
			response.write(data);
			response.end();
		});
	}
}
