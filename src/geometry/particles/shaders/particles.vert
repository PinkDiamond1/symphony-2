uniform float size;
uniform float scale;

uniform vec3 uSpawnLocation;
uniform vec2 uOriginOffset;
uniform float uTime;
uniform sampler2D positionTexture;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <color_vertex>
	#include <begin_vertex>


	transformed.xyz = texture2D(positionTexture, position.xy).xyz;

	transformed.xz -= uOriginOffset;

	transformed.xyz += uSpawnLocation;



	#include <morphtarget_vertex>
	#include <project_vertex>

	gl_PointSize = 0.05;

	#ifdef USE_SIZEATTENUATION

		bool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );

		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );

	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}